import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    OrderStatus,
    PaymentProvider,
    PaymentStatus,
} from "src/generated/prisma/enums";

import { BkashStrategy } from "./bkash/strategy/bkash.strategy";
import { PaymentDto } from "./dto/payment.dto";
import { PaymentQueueService } from "./job/payment.queue.service";
import { StripeStrategy } from "./stripe/strategy/stripe.strategy";

@Injectable()
export class PaymentService {
    constructor(
        private readonly stripe: StripeStrategy,
        private readonly bkash: BkashStrategy,
        private readonly prisma: PrismaService,
        private readonly paymentQueue: PaymentQueueService
    ) {}

    private getStrategy(provider: PaymentProvider) {
        switch (provider) {
            case PaymentProvider.STRIPE:
                return this.stripe;
            case PaymentProvider.BKASH:
                return this.bkash;
            default:
                throw new BadRequestException("Invalid payment provider");
        }
    }

    async createPayment(payload: PaymentDto) {
        const provider = this.getStrategy(payload.provider);

        const idempotencyKey = `${crypto.randomUUID()}-${Date.now()}`;

        const payment = await this.prisma.payment.create({
            data: {
                userId: payload.userId,
                amount: payload.amount,
                orderId: payload.orderId,
                provider: payload.provider,
                idempotencyKey,
                currency: payload.currency,
            },
        });

        const result = await provider.createPayment({
            items: payload.items,
            orderId: payload.orderId,
            payment: {
                id: payment.id,
                currency: payment.currency,
                idempotencyKey,
                amount: payment.amount,
            },
            user: {
                id: payload.userId,
                email: payload.user.email,
                name: payload.user.name,
            },
        });

        const providerPaymentId =
            "transactionId" in result
                ? result.transactionId
                : "providerPaymentId" in result
                  ? result.providerPaymentId
                  : null;

        if (providerPaymentId) {
            await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    transactionId: providerPaymentId,
                },
            });
        }

        await this.paymentQueue.enqueuePaymentExpiration(
            payment.id,
            payment.orderId
        );

        return result;
    }

    async handlePaymentSuccess(payload: {
        paymentId: string;
        providerPaymentId: string | null;
    }) {
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: {
                    id: payload.paymentId,
                },
            });

            if (!payment) {
                throw new NotFoundException(
                    `Payment ${payload.paymentId} not found`
                );
            }

            if (payment.status === PaymentStatus.PAID) {
                return payment;
            }

            if (
                payment.status === PaymentStatus.FAILED ||
                payment.status === PaymentStatus.EXPIRED
            ) {
                return payment;
            }

            const updatedPayment = await tx.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: PaymentStatus.PAID,
                    transactionId: payload.providerPaymentId,
                },
            });

            await tx.order.updateMany({
                where: {
                    id: payment.orderId,
                    status: OrderStatus.PENDING,
                },
                data: {
                    status: OrderStatus.CONFIRMED,
                    paidAt: new Date(),
                },
            });

            return updatedPayment;
        });
    }

    async handlePaymentFailed(payload: { paymentId: string }) {
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: {
                    id: payload.paymentId,
                },
            });

            if (!payment) {
                throw new NotFoundException(
                    `Payment ${payload.paymentId} not found`
                );
            }

            if (payment.status === PaymentStatus.FAILED) {
                return payment;
            }

            if (payment.status === PaymentStatus.PAID) {
                return payment;
            }

            const updatedPayment = await tx.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: PaymentStatus.FAILED,
                },
            });

            await tx.order.updateMany({
                where: {
                    id: payment.orderId,
                    status: OrderStatus.PENDING,
                },
                data: {
                    status: OrderStatus.CANCELED,
                    canceledAt: new Date(),
                },
            });

            return updatedPayment;
        });
    }

    // handle stripe webhook
    async handlePaymentExpired(payload: { paymentId: string }) {
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: {
                    id: payload.paymentId,
                },
            });

            if (!payment) {
                throw new NotFoundException(
                    `Payment ${payload.paymentId} not found`
                );
            }

            if (payment.status === PaymentStatus.EXPIRED) {
                return payment;
            }

            if (payment.status === PaymentStatus.PAID) {
                return payment;
            }

            const updatedPayment = await tx.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: PaymentStatus.EXPIRED,
                },
            });

            await tx.order.updateMany({
                where: {
                    id: payment.orderId,
                    status: OrderStatus.PENDING,
                },
                data: {
                    status: OrderStatus.CANCELED,
                    canceledAt: new Date(),
                },
            });

            return updatedPayment;
        });
    }

    // handles bullmq job
    async expirePayment(paymentId: string, orderId: string) {
        return this.prisma.$transaction(async (tx) => {
            const paymentResult = await tx.payment.updateMany({
                where: {
                    id: paymentId,
                    status: PaymentStatus.PENDING,
                    expiresAt: {
                        lte: new Date(),
                    },
                },
                data: {
                    status: PaymentStatus.EXPIRED,
                },
            });

            // Payment was already paid/expired/etc.
            if (paymentResult.count === 0) {
                return false;
            }

            const activePayment = await tx.payment.findFirst({
                where: {
                    orderId,
                    status: {
                        in: [PaymentStatus.PENDING, PaymentStatus.PAID],
                    },
                },
                select: {
                    id: true,
                },
            });

            // Another payment is still active.
            if (activePayment) {
                return true;
            }

            await tx.order.updateMany({
                where: {
                    id: orderId,
                    status: OrderStatus.PENDING,
                },
                data: {
                    status: OrderStatus.CANCELED,
                    canceledAt: new Date(),
                },
            });

            return true;
        });
    }
}
