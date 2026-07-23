import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";

import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) {}

    async createOrder(userId: string, payload: CreateOrderDto) {
        const productIds = payload.items.map((item) => item.productId);

        const uniqueProductIds = new Set(productIds);

        if (uniqueProductIds.size !== productIds.length) {
            throw new BadRequestException(
                "Each product can only appear once in an order"
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const products = await tx.product.findMany({
                where: {
                    id: {
                        in: productIds,
                    },
                },
            });

            if (products.length !== productIds.length) {
                throw new BadRequestException(
                    "One or more products were not found"
                );
            }

            const productMap = new Map(
                products.map((product) => [product.id, product])
            );

            const items = payload.items.map((item) => {
                const product = productMap.get(item.productId);

                if (!product) {
                    throw new BadRequestException(
                        `Product ${item.productId} not found`
                    );
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${product.id}`
                    );
                }

                return {
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    subtotal: product.price.mul(item.quantity),
                };
            });

            const total = items.reduce(
                (acc, item) => acc.add(item.subtotal),
                new Prisma.Decimal(0)
            );

            const order = await tx.order.create({
                data: {
                    userId,
                    total,
                    items: {
                        createMany: {
                            data: items,
                        },
                    },
                },
                include: {
                    items: true,
                },
            });

            for (const item of payload.items) {
                const result = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stock: {
                            gte: item.quantity,
                        },
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });

                if (result.count === 0) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${item.productId}`
                    );
                }
            }

            return order;
        });
    }
}
