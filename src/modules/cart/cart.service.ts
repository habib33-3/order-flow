import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";

import { AddItemToCartDto } from "./dto/add-item-to-cart.dto";

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
}
