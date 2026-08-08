import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { OrderStatus, Prisma } from "src/generated/prisma/client";
import { JwtPayload } from "src/types/types";

import { PaymentService } from "../payment/payment.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly payment: PaymentService
    ) {}

    async createOrder(userId: string, payload: CreateOrderDto) {
        const productIds = payload.items.map((item) => item.productId);

        const uniqueProductIds = new Set(productIds);

        if (uniqueProductIds.size !== productIds.length) {
            throw new BadRequestException(
                "Each product can only appear once in an order"
            );
        }

        const order = await this.prisma.$transaction(async (tx) => {
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

                if (product.status !== "ACTIVE") {
                    throw new BadRequestException(
                        `Product ${product.id} is not available`
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
                select: {
                    id: true,
                    total: true,
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    items: {
                        select: {
                            productId: true,
                            quantity: true,
                            unitPrice: true,
                            product: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
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

        const checkout = await this.payment.createPayment({
            items: order.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                product: {
                    name: item.product.name,
                },
            })),
            amount: order.total.toNumber(),
            orderId: order.id,
            user: {
                id: userId,
                email: order.user.email,
                name: order.user.name,
            },
            userId,
            provider: payload.paymentProvider,
            currency: payload.currency,
        });

        return checkout;
    }

    private async getOrders(
        where: Prisma.OrderWhereInput,
        search?: string,
        cursorId?: string,
        limit = 10,
        filter?: {
            status?: OrderStatus;
        },
        sort: "asc" | "desc" = "desc",
        sortBy: "createdAt" | "total" = "createdAt"
    ) {
        limit = Math.min(Math.max(limit, 1), 50);

        if (search?.trim()) {
            const searchTerm = search.trim();

            where.OR = [
                {
                    user: {
                        name: {
                            contains: searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    user: {
                        email: {
                            contains: searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
            ];
        }

        if (filter?.status) {
            where.status = filter.status;
        }

        return this.prisma.order.findMany({
            where,
            take: limit + 1,
            cursor: cursorId
                ? {
                      id: cursorId,
                  }
                : undefined,
            skip: cursorId ? 1 : 0,
            orderBy: [
                {
                    [sortBy]: sort,
                },
                {
                    id: sort,
                },
            ],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: true,
            },
        });
    }

    async getAllOrders(
        search?: string,
        cursorId?: string,
        limit = 10,
        filter?: {
            status?: OrderStatus;
        },
        sort: "asc" | "desc" = "desc",
        sortBy: "createdAt" | "total" = "createdAt"
    ) {
        const where: Prisma.OrderWhereInput = {};

        return this.getOrders(
            where,
            search,
            cursorId,
            limit,
            filter,
            sort,
            sortBy
        );
    }

    async getMyOrders(
        userId: string,
        search?: string,
        cursorId?: string,
        limit = 10,
        filter?: {
            status?: OrderStatus;
        },
        sort: "asc" | "desc" = "desc",
        sortBy: "createdAt" | "total" = "createdAt"
    ) {
        const where: Prisma.OrderWhereInput = {
            userId,
        };

        return this.getOrders(
            where,
            search,
            cursorId,
            limit,
            filter,
            sort,
            sortBy
        );
    }

    async cancelOrder(userId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            select: {
                id: true,
                status: true,
                items: {
                    select: {
                        productId: true,
                        quantity: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException("Order not found");
        }

        if (order.status !== "PENDING") {
            throw new BadRequestException("Order is not pending");
        }

        const canceledOrder = await this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.updateMany({
                where: {
                    id: order.id,
                    userId,
                    status: "PENDING",
                },
                data: {
                    status: "CANCELED",
                },
            });

            if (updatedOrder.count === 0) {
                throw new BadRequestException(
                    "Order is no longer pending or has already been canceled"
                );
            }

            await Promise.all(
                order.items.map(async (item) =>
                    tx.product.update({
                        where: {
                            id: item.productId,
                        },
                        data: {
                            stock: {
                                increment: item.quantity,
                            },
                        },
                    })
                )
            );

            return tx.order.findUnique({
                where: {
                    id: order.id,
                },
                include: {
                    items: true,
                },
            });
        });

        return canceledOrder;
    }

    async getOrderById(id: string, user: JwtPayload) {
        const order = await this.prisma.order.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
                payments: true,
                user: {
                    omit: {
                        password: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException("Order not found");
        }

        if (order.userId !== user.sub && user.role !== "ADMIN") {
            throw new ForbiddenException(
                "You are not authorized to view this order"
            );
        }

        return order;
    }

    async markOrderAsProcessing(id: string, user: JwtPayload) {
        const order = await this.getOrderById(id, user);

        if (order.status !== "CONFIRMED") {
            throw new BadRequestException(
                "Only confirmed orders can be marked as processing"
            );
        }

        await this.prisma.order.update({
            where: { id },
            data: {
                status: "PROCESSING",
            },
        });

        return {
            message: "Order marked as processing",
        };
    }

    async markAsShipped(id: string, user: JwtPayload) {
        const order = await this.getOrderById(id, user);

        if (order.status !== "PROCESSING") {
            throw new BadRequestException(
                "Only processing orders can be marked as shipped"
            );
        }

        await this.prisma.order.update({
            where: { id },
            data: {
                status: "SHIPPED",
            },
        });

        return {
            message: "Order marked as shipped",
        };
    }

    async markAsDelivered(id: string, user: JwtPayload) {
        const order = await this.getOrderById(id, user);

        if (order.userId !== user.sub) {
            throw new ForbiddenException(
                "You are not authorized to mark this order"
            );
        }

        if (order.status !== "SHIPPED") {
            throw new BadRequestException(
                "Only shipped orders can be marked as delivered"
            );
        }

        await this.prisma.order.update({
            where: { id },
            data: {
                status: "DELIVERED",
            },
        });

        return {
            message: "Order marked as delivered",
        };
    }
}
