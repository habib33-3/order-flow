import { Global, Module } from "@nestjs/common";

import { PaymentFactory } from "./payment.factory";
import { BkashStrategy } from "./strategies/bkash.strategy";
import { StripeStrategy } from "./strategies/stripe.strategy";

@Global()
@Module({
    providers: [PaymentFactory, StripeStrategy, BkashStrategy],
    exports: [PaymentFactory],
})
export class PaymentModule {}
