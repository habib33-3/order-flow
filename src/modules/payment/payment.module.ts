import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";

import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";
import { QUEUE_NAMES } from "src/common/queue/queue.constants";

import { BkashCallbackController } from "./bkash/bkash-callback.controller";
import { BkashCallbackService } from "./bkash/bkash-callback.service";
import { BkashStrategy } from "./bkash/strategy/bkash.strategy";
import { PaymentQueueService } from "./job/payment.queue.service";
import { PaymentService } from "./payment.service";
import { StripeStrategy } from "./stripe/strategy/stripe.strategy";
import { StripeWebhookController } from "./stripe/stripe-webhook.controller";
import { StripeWebhookService } from "./stripe/stripe-webhook.service";
import { StripeService } from "./stripe/stripe.service";

@Global()
@Module({
    imports: [
        BullModule.registerQueue({
            name: QUEUE_NAMES.PAYMENT,
        }),
        BullBoardModule.forFeature({
            name: QUEUE_NAMES.PAYMENT,
            adapter: BullMQAdapter,
        }),
    ],
    providers: [
        PaymentService,
        StripeStrategy,
        BkashStrategy,
        StripeService,
        StripeWebhookService,
        BkashCallbackService,
        PaymentQueueService,
    ],
    exports: [PaymentService],
    controllers: [StripeWebhookController, BkashCallbackController],
})
export class PaymentModule {}
