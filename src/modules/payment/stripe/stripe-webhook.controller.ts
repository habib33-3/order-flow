import { Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";

import { type Request } from "express";

import { Public } from "src/common/decorators/public.decorator";
import { RateLimitPolicy } from "src/common/rate-limit/rate-limit.config";
import { RateLimit } from "src/common/rate-limit/rate-limit.decorator";

import { StripeWebhookService } from "./stripe-webhook.service";

@Public()
@Controller("payments/stripe")
export class StripeWebhookController {
    constructor(private readonly stripeWebhookService: StripeWebhookService) {}

    @ApiExcludeEndpoint()
    @Post("webhook")
    @RateLimit(RateLimitPolicy.EXEMPT)
    @HttpCode(200)
    async handleWebhook(
        @Req() req: Request,
        @Headers("stripe-signature") signature: string
    ) {
        return this.stripeWebhookService.handleWebhook(req.rawBody!, signature);
    }
}
