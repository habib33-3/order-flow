import { Global, Module } from "@nestjs/common";

import { BkashCallbackController } from "./bkash/bkash-callback.controller";
import { BkashCallbackService } from "./bkash/bkash-callback.service";
import { BkashStrategy } from "./bkash/strategy/bkash.strategy";
import { PaymentService } from "./payment.service";
import { StripeStrategy } from "./stripe/strategy/stripe.strategy";
import { StripeWebhookController } from "./stripe/stripe-webhook.controller";
import { StripeWebhookService } from "./stripe/stripe-webhook.service";
import { StripeService } from "./stripe/stripe.service";

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
