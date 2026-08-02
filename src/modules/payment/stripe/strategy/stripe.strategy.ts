import { Injectable } from "@nestjs/common";

import { env } from "src/common/env/env";
import { PrismaService } from "src/common/prisma/prisma.service";
import { PaymentProvider } from "src/generated/prisma/enums";
import type Stripe from "stripe";

import { ProviderPaymentDto } from "../../dto/payment.dto";
import { StripeService } from "../stripe.service";

@Injectable()
export class StripeStrategy {
    constructor(
        private readonly stripe: StripeService,
        private readonly prisma: PrismaService
    ) {}

    readonly provider = PaymentProvider.STRIPE;

    async createPayment(payload: ProviderPaymentDto) {
        const items: Stripe.Checkout.SessionCreateParams.LineItem[] =
            payload.items.map((item) => ({
                price_data: {
                    currency: payload.payment.currency.toLowerCase(),
                    product_data: {
                        name: item.product.name,
                    },
                    unit_amount: item.unitPrice.mul(100).toNumber(),
                },
                quantity: item.quantity,
            }));

        const session = await this.stripe.client.checkout.sessions.create(
            {
                mode: "payment",
                line_items: items,
                currency: payload.payment.currency.toLowerCase(),
                customer_email: payload.user.email,

                metadata: {
                    paymentId: payload.payment.id,
                    orderId: payload.orderId,
                    userId: payload.user.id,
                },

                success_url:
                    `${env.CLIENT_URL}/payment/success` +
                    `?session_id={CHECKOUT_SESSION_ID}`,

                cancel_url: `${env.CLIENT_URL}/payment/cancel`,
            },
            {
                idempotencyKey: payload.payment.idempotencyKey,
            }
        );

        await this.prisma.payment.update({
            where: {
                id: payload.payment.id,
            },
            data: {
                transactionId: session.id,
                provider: this.provider,
            },
        });

        return {
            checkoutUrl: session.url,
            transactionId: session.id,
            provider: this.provider,
        };
    }
}
