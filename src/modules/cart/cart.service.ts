import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";

import { AddItemToCartDto } from "./dto/add-item-to-cart.dto";
import { ManageCartDto } from "./dto/manage-cart.dto";

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) {}

    async addItemToCart(userId: string, payload: AddItemToCartDto) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: payload.productId,
            },
            select: {
                id: true,
            },
        });

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

        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: payload.productId,
                },
            },
        });

        if (existingItem) {
            throw new BadRequestException("Product is already in the cart");
        }

        await this.prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: payload.productId,
                quantity: 1,
            },
        });

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
            throw new NotFoundException("Cart not found");
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

        return {
            message: "Cart updated successfully",
        };
    }

    async getMyCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: {
                userId,
            },
            select: {
                id: true,
                cartItems: {
                    select: {
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

        return {
            message: "Cart cleared successfully",
        };
    }
}
