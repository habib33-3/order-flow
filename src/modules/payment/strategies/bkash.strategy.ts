/* eslint-disable no-console */
import { Injectable } from "@nestjs/common";

import { PaymentProvider } from "src/generated/prisma/enums";

@Injectable()
export class BkashStrategy {
    readonly provider = PaymentProvider.BKASH;

    async createPayment() {
        console.log("Bkash payment created");
    }

    async verifyPayment() {
        console.log("Bkash payment verified");
    }
}
