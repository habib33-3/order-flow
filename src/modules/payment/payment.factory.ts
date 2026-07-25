import { BadRequestException, Injectable } from "@nestjs/common";

import { PaymentProvider } from "src/generated/prisma/enums";

import { BkashStrategy } from "./strategies/bkash.strategy";
import { StripeStrategy } from "./strategies/stripe.strategy";

@Injectable()
export class PaymentFactory {
    constructor(
        private readonly stripe: StripeStrategy,
        private readonly bkash: BkashStrategy
    ) {}

    getStrategy(provider: PaymentProvider) {
        switch (provider) {
            case PaymentProvider.STRIPE:
                return this.stripe;
            case PaymentProvider.BKASH:
                return this.bkash;
            default:
                throw new BadRequestException("Invalid payment provider");
        }
    }
}
