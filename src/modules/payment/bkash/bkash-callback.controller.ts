import { Controller, Get, Query } from "@nestjs/common";

import { Public } from "src/common/decorators/public.decorator";

import { BkashCallbackService } from "./bkash-callback.service";

@Public()
@Controller("payments/bkash")
export class BkashCallbackController {
    constructor(private readonly callbackService: BkashCallbackService) {}

    @Get("callback")
    async callback(
        @Query("paymentID") paymentID: string,
        @Query("status") status?: string
    ) {
        const payment = await this.callbackService.handleCallback({
            paymentID,
            status,
        });

        return payment;
    }
}
