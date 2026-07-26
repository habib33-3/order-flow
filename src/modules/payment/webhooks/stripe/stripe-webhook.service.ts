import { BadRequestException, Injectable, Logger } from "@nestjs/common";

import { env } from "src/common/env/env";
import { PrismaService } from "src/common/prisma/prisma.service";
import type Stripe from "stripe";

import { PaymentService } from "../../payment.service";
import { StripeService } from "../../stripe.service";

@Injectable()
export class StripeWebhookService {
    constructor(
        private readonly stripe: StripeService,
        private readonly prisma: PrismaService,
        private readonly payment: PaymentService
    ) {}

    private readonly logger = new Logger(StripeWebhookService.name);

    private getPaymentId(session: Stripe.Checkout.Session): string {
        const paymentId = session.metadata?.paymentId;

        if (!paymentId) {
            throw new BadRequestException(
                `Missing paymentId in Stripe session metadata: ${session.id}`
            );
        }

        return paymentId;
    }

    private getPaymentIntentId(
        session: Stripe.Checkout.Session
    ): string | null {
        if (typeof session.payment_intent === "string") {
            return session.payment_intent;
        }

        return null;
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const paymentId = this.getPaymentId(session);

        if (session.payment_status !== "paid") {
            return;
        }

        await this.payment.handlePaymentSuccess({
            paymentId,
            providerPaymentId: this.getPaymentIntentId(session),
        });
    }

    private async handleAsyncPaymentSucceeded(
        session: Stripe.Checkout.Session
    ) {
        const paymentId = this.getPaymentId(session);

        await this.payment.handlePaymentSuccess({
            paymentId,
            providerPaymentId: this.getPaymentIntentId(session),
        });
    }

    private async handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
        const paymentId = this.getPaymentId(session);

        await this.payment.handlePaymentFailed({
            paymentId,
        });
    }

    private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
        const paymentId = this.getPaymentId(session);

        await this.payment.handlePaymentExpired({
            paymentId,
        });
    }

    private constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
        try {
            return this.stripe.client.webhooks.constructEvent(
                rawBody,
                signature,
                env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            this.logger.error(
                "Failed to verify Stripe webhook signature",
                error
            );

            throw new BadRequestException("Invalid Stripe webhook signature");
        }
    }

    async handleWebhook(rawBody: Buffer, signature: string) {
        const event = this.constructEvent(rawBody, signature);

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (event.type) {
            case "checkout.session.completed":
                await this.handleCheckoutCompleted(event.data.object);
                break;

            case "checkout.session.async_payment_succeeded":
                await this.handleAsyncPaymentSucceeded(event.data.object);
                break;

            case "checkout.session.async_payment_failed":
                await this.handleAsyncPaymentFailed(event.data.object);
                break;

            case "checkout.session.expired":
                await this.handleCheckoutExpired(event.data.object);
                break;

            default:
                this.logger.debug(`Unhandled Stripe event: ${event.type}`);
        }

        return {
            received: true,
        };
    }
}
