import { Global, Module } from "@nestjs/common";

import { BkashCallbackController } from "./bkash/bkash-callback.controller";
import { BkashCallbackService } from "./bkash/bkash-callback.service";
import { PaymentService } from "./payment.service";
import { BkashStrategy } from "./strategies/bkash.strategy";
import { StripeStrategy } from "./strategies/stripe.strategy";
import { StripeService } from "./stripe.service";
import { StripeWebhookController } from "./stripe/stripe-webhook.controller";
import { StripeWebhookService } from "./stripe/stripe-webhook.service";

@Global()
@Module({
    providers: [
        PaymentService,
        StripeStrategy,
        BkashStrategy,
        StripeService,
        StripeWebhookService,
        BkashCallbackService,
    ],
    exports: [PaymentService],
    controllers: [StripeWebhookController, BkashCallbackController],
})
export class PaymentModule {}
