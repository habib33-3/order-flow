import { Global, Module } from "@nestjs/common";

import { PaymentService } from "./payment.service";
import { BkashStrategy } from "./strategies/bkash.strategy";
import { StripeStrategy } from "./strategies/stripe.strategy";
import { StripeService } from "./stripe.service";

@Global()
@Module({
    providers: [PaymentService, StripeStrategy, BkashStrategy, StripeService],
    exports: [PaymentService],
})
export class PaymentModule {}
