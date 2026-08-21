import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { cartCacheKeyWithUserId } from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma } from "src/generated/prisma/client";

import { ProductsService } from "../products/products.service";
import { AddItemToCartDto } from "./dto/add-item-to-cart.dto";
import { ManageCartDto } from "./dto/manage-cart.dto";
import { CartType } from "./type";

@Injectable()
export class CartService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly productService: ProductsService
    ) {}

    async addItemToCart(userId: string, payload: AddItemToCartDto) {
        const product = await this.productService.getProductById(
            payload.productId
        );

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        const cart = await this.prisma.cart.upsert({
            where: {
                userId,
            },
            create: {
                userId,
            },
            update: {},
        });

        try {
            await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: payload.productId,
                    quantity: 1,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new BadRequestException("Product is already in the cart");
            }
            throw error;
        }

        await this.redis.delete(cartCacheKeyWithUserId(userId));

        return {
            message: "Product added to cart successfully",
        };
    }

    async manageCart(userId: string, payload: ManageCartDto) {
        const productSet = new Set(payload.items.map((item) => item.productId));

        if (productSet.size !== payload.items.length) {
            throw new BadRequestException(
                "Each product can only appear once in a cart"
            );
        }

        const cart = await this.prisma.cart.findUnique({
            where: {
                userId,
            },
            select: {
                id: true,
            },
        });

        if (!cart) {
            return { id: null, cartItems: [] };
        }

        const cartItems = await this.prisma.cartItem.findMany({
            where: {
                cartId: cart.id,
            },
            select: {
                productId: true,
            },
        });

        if (!cartItems.length) {
            throw new NotFoundException("Cart is empty");
        }

        const cartProductIds = new Set(cartItems.map((item) => item.productId));

        // Make sure every requested product belongs to this cart
        for (const item of payload.items) {
            if (!cartProductIds.has(item.productId)) {
                throw new BadRequestException(
                    `Product ${item.productId} does not belong to this cart`
                );
            }
        }

        // Update quantities atomically
        await this.prisma.$transaction(async (tx) => {
            for (const item of payload.items) {
                await tx.cartItem.update({
                    where: {
                        cartId_productId: {
                            cartId: cart.id,
                            productId: item.productId,
                        },
                    },
                    data: {
                        quantity: item.quantity,
                    },
                });
            }
        });

        await this.redis.delete(cartCacheKeyWithUserId(userId));

        return {
            message: "Cart updated successfully",
        };
    }

    async removeItemFromCart(userId: string, productId: string) {
        const cart = await this.getMyCart(userId);

        const cartItem = cart.cartItems.find(
            (item) => item.product.id === productId
        );

        if (!cartItem) {
            throw new NotFoundException("Product not found in cart");
        }

        await this.prisma.cartItem.delete({
            where: {
                id: cartItem.id,
            },
        });

        await this.redis.delete(cartCacheKeyWithUserId(userId));

        return {
            message: "Product removed from cart successfully",
        };
    }

    async getMyCart(userId: string) {
        const cacheKey = cartCacheKeyWithUserId(userId);

        const cachedCart = await this.redis.get<CartType>(cacheKey);

        if (cachedCart !== null) {
            return cachedCart;
        }

        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            select: {
                id: true,
                cartItems: {
                    select: {
                        id: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                thumbnail: true,
                            },
                        },
                    },
                },
            },
        });

        if (!cart) {
            throw new NotFoundException("Cart not found");
        }

        await this.redis.set(cacheKey, cart);

        return cart;
    }

    async clearCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: {
                userId,
            },
            select: {
                id: true,
            },
        });

        if (!cart) {
            throw new NotFoundException("Cart not found");
        }

        await this.prisma.cartItem.deleteMany({
            where: {
                cartId: cart.id,
            },
        });

        await this.redis.delete(cartCacheKeyWithUserId(userId));

        return {
            message: "Cart cleared successfully",
        };
    }
}
