import { Injectable } from "@nestjs/common";

import { env } from "src/common/env/env";
import Stripe from "stripe";

@Injectable()
export class StripeService {
    readonly client: Stripe;

    constructor() {
        this.client = new Stripe(env.STRIPE_SECRET_KEY);
    }
}
