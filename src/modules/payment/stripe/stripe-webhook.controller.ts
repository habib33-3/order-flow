import { Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";

import { type Request } from "express";

import { Public } from "src/common/decorators/public.decorator";

import { StripeWebhookService } from "./stripe-webhook.service";

@Public()
@Controller("payments/stripe")
export class StripeWebhookController {
    constructor(private readonly stripeWebhookService: StripeWebhookService) {}

    @ApiExcludeEndpoint()
    @Post("webhook")
    @HttpCode(200)
    async handleWebhook(
        @Req() req: Request,
        @Headers("stripe-signature") signature: string
    ) {
        return this.stripeWebhookService.handleWebhook(req.rawBody!, signature);
    }
}
