import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { PaymentProvider, PaymentStatus } from "src/generated/prisma/enums";

import { PaymentService } from "../payment.service";
import { BkashStrategy } from "../strategies/bkash.strategy";

@Injectable()
export class BkashCallbackService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly payment: PaymentService,
        private readonly bkash: BkashStrategy
    ) {}

    async handleCallback(payload: { paymentID: string; status?: string }) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                provider: PaymentProvider.BKASH,
                transactionId: payload.paymentID,
            },
        });

        if (!payment) {
            throw new NotFoundException(
                `Payment for bKash payment ${payload.paymentID} not found`
            );
        }

        if (
            payment.status === PaymentStatus.PAID ||
            payment.status === PaymentStatus.FAILED ||
            payment.status === PaymentStatus.EXPIRED
        ) {
            return payment;
        }

        const callbackStatus = payload.status?.toLowerCase();
        if (callbackStatus && callbackStatus !== "success") {
            return this.payment.handlePaymentFailed({
                paymentId: payment.id,
            });
        }

        const result = await this.bkash.executePayment(payload.paymentID);

        if (result.transactionStatus === "Completed") {
            return this.payment.handlePaymentSuccess({
                paymentId: payment.id,
                providerPaymentId: result.trxID,
            });
        }

        if (result.transactionStatus === "Failed") {
            return this.payment.handlePaymentFailed({
                paymentId: payment.id,
            });
        }

        const queried = await this.bkash.queryPayment(payload.paymentID);

        if (queried.transactionStatus === "Failed") {
            return this.payment.handlePaymentFailed({
                paymentId: payment.id,
            });
        }

        return {
            status: "PENDING",
            paymentId: payment.id,
            providerPaymentId: payload.paymentID,
        };
    }
}
