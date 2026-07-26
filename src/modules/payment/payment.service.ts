import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { PaymentProvider } from "src/generated/prisma/enums";

import { PaymentDto } from "./dto/payment.dto";
import { BkashStrategy } from "./strategies/bkash.strategy";
import { StripeStrategy } from "./strategies/stripe.strategy";

@Injectable()
export class PaymentService {
    constructor(
        private readonly stripe: StripeStrategy,
        private readonly bkash: BkashStrategy,
        private readonly prisma: PrismaService
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
            },
        });

        const result = await provider.createPayment({
            items: payload.items,
            orderId: payload.orderId,
            payment: {
                id: payment.id,
                currency: payment.currency,
                idempotencyKey,
            },
            user: {
                id: payload.userId,
                email: payload.user.email,
                name: payload.user.name,
            },
        });

        return result;
    }
}
