/* eslint-disable no-console */
import { Injectable } from "@nestjs/common";

import { PaymentProvider } from "src/generated/prisma/enums";

@Injectable()
export class StripeStrategy {
    readonly provider = PaymentProvider.STRIPE;

    async createPayment() {
        console.log("Stripe payment created");
    }

    async verifyPayment() {
        console.log("Stripe payment verified");
    }
}
