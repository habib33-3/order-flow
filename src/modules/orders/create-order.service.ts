import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    couponCacheKeyWithCode,
    couponCacheKeyWithId,
    couponListCache,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma, Product } from "src/generated/prisma/client";

import { CartService } from "../cart/cart.service";
import { CouponAnalyticsService } from "../coupon/coupon-analytics/coupon-analytics.service";
import { CouponService } from "../coupon/coupon/coupon.service";
import { PaymentService } from "../payment/payment.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CreatedOrder, OrderCartItem } from "./type";

@Injectable()
export class CreateOrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cartService: CartService,
        private readonly payment: PaymentService,
        private readonly couponService: CouponService,
        private readonly couponAnalyticsService: CouponAnalyticsService,
        private readonly cache: RedisService
    ) {}

    async getValidatedCartItems(userId: string) {
        const cart = await this.cartService.getMyCart(userId);

        if (cart.cartItems.length === 0) {
            throw new BadRequestException("Cart is empty");
        }

        return cart.cartItems;
    }

    async createOrderAndReserveStock(
        userId: string,
        cartItems: OrderCartItem[],
        shippingAddress: string,
        orderNote?: string,
        couponCode?: string
    ): Promise<CreatedOrder> {
        const productIds = cartItems.map((item) => item.product.id);

        const { order, coupon } = await this.prisma.$transaction(async (tx) => {
            const products = await this.findProductsForOrder(tx, productIds);

            const orderItems = this.buildValidatedOrderItems(
                cartItems,
                products
            );

            const orderTotal = this.calculateOrderTotal(orderItems);

            const coupon = couponCode
                ? await this.couponService.redeemCoupon(
                      couponCode,
                      userId,
                      orderTotal.toNumber(),
                      tx
                  )
                : null;

            const finalTotal = coupon
                ? orderTotal.sub(coupon.discount)
                : orderTotal;

            const order = await this.persistOrder(
                tx,
                userId,
                orderTotal,
                finalTotal,
                coupon
                    ? {
                          couponId: coupon.couponId,
                          code: coupon.code,
                          discount: coupon.discount,
                      }
                    : null,
                shippingAddress,
                orderNote,
                orderItems
            );
            await this.reserveProductsStock(tx, cartItems);

            return {
                order,
                coupon,
            };
        });

        // Only invalidate cache after the transaction successfully commits.
        if (coupon) {
            await Promise.all([
                this.cache.delete(couponCacheKeyWithCode(coupon.code)),
                this.cache.delete(couponCacheKeyWithId(coupon.couponId)),
                this.cache.delete(couponListCache()),
            ]);

            await this.couponAnalyticsService.invalidateCouponAnalyticsCache(
                userId
            );
        }

        return order;
    }

    private async findProductsForOrder(
        tx: Prisma.TransactionClient,
        productIds: string[]
    ): Promise<Product[]> {
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

        return products;
    }

    private buildValidatedOrderItems(
        cartItems: OrderCartItem[],
        products: Product[]
    ) {
        const productMap = new Map(
            products.map((product) => [product.id, product])
        );

        return cartItems.map((cartItem) => {
            const product = productMap.get(cartItem.product.id);

            if (!product) {
                throw new BadRequestException(
                    `Product ${cartItem.product.id} not found`
                );
            }

            if (product.status !== "ACTIVE") {
                throw new BadRequestException(
                    `Product ${product.id} is not available`
                );
            }

            if (product.stock < cartItem.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${product.id}`
                );
            }

            return {
                productId: product.id,
                quantity: cartItem.quantity,
                unitPrice: product.price,
                subtotal: product.price.mul(cartItem.quantity),
            };
        });
    }

    private calculateOrderTotal(
        orderItems: {
            subtotal: Prisma.Decimal;
        }[]
    ): Prisma.Decimal {
        return orderItems.reduce(
            (total, item) => total.add(item.subtotal),
            new Prisma.Decimal(0)
        );
    }

    private async persistOrder(
        tx: Prisma.TransactionClient,
        userId: string,
        subtotal: Prisma.Decimal,
        total: Prisma.Decimal,
        coupon: {
            couponId: string;
            code: string;
            discount: Prisma.Decimal;
        } | null,
        shippingAddress: string,
        orderNote: string | undefined,
        orderItems: {
            productId: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            subtotal: Prisma.Decimal;
        }[]
    ): Promise<CreatedOrder> {
        return tx.order.create({
            data: {
                userId,
                subtotal,
                total,
                discountAmount: coupon?.discount ?? new Prisma.Decimal(0),
                couponId: coupon?.couponId,
                couponCode: coupon?.code,
                shippingAddress,
                note: orderNote,
                items: {
                    createMany: {
                        data: orderItems,
                    },
                },
            },
            select: {
                id: true,
                subtotal: true,
                discountAmount: true,
                total: true,
                couponId: true,
                couponCode: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
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
    }

    private async reserveProductsStock(
        tx: Prisma.TransactionClient,
        cartItems: OrderCartItem[]
    ): Promise<void> {
        for (const cartItem of cartItems) {
            const result = await tx.product.updateMany({
                where: {
                    id: cartItem.product.id,
                    status: "ACTIVE",
                    stock: {
                        gte: cartItem.quantity,
                    },
                },
                data: {
                    stock: {
                        decrement: cartItem.quantity,
                    },
                },
            });

            if (result.count === 0) {
                throw new BadRequestException(
                    `Insufficient stock for product ${cartItem.product.id}`
                );
            }
        }
    }

    async createPaymentCheckout(
        order: CreatedOrder,
        userId: string,
        payload: CreateOrderDto
    ) {
        return this.payment.createPayment({
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
    }
}
