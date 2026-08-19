import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { OrderStatus, Prisma } from "src/generated/prisma/client";
import { JwtPayload } from "src/types/types";

import { ShippingAddressService } from "../shipping-address/shipping-address.service";
import { CreateOrderService } from "./create-order.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly shippingAddressService: ShippingAddressService,
        private readonly createOrderService: CreateOrderService
    ) {}

    async createOrder(userId: string, payload: CreateOrderDto) {
        const cartItems =
            await this.createOrderService.getValidatedCartItems(userId);

        const shippingAddress =
            await this.shippingAddressService.generateShippingAddress(
                payload.shippingAddressId,
                userId
            );

        const order = await this.createOrderService.createOrderAndReserveStock(
            userId,
            cartItems,
            shippingAddress,
            payload.orderNote
        );

        return this.createOrderService.createPaymentCheckout(
            order,
            userId,
            payload
        );
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
