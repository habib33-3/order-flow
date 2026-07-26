import { Global, Module } from "@nestjs/common";

import { PaymentService } from "./payment.service";
import { BkashStrategy } from "./strategies/bkash.strategy";
import { StripeStrategy } from "./strategies/stripe.strategy";
import { StripeService } from "./stripe.service";
import { StripeWebhookController } from "./webhooks/stripe/stripe-webhook.controller";
import { StripeWebhookService } from "./webhooks/stripe/stripe-webhook.service";

@Global()
@Module({
    providers: [
        PaymentService,
        StripeStrategy,
        BkashStrategy,
        StripeService,
        StripeWebhookService,
    ],
    exports: [PaymentService],
    controllers: [StripeWebhookController],
})
export class PaymentModule {}
