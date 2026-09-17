import { Controller } from "@nestjs/common";

import { CouponAnalyticsService } from "./coupon-analytics.service";

@Controller("coupon-analytics")
export class CouponAnalyticsController {
    constructor(
        private readonly couponAnalyticsService: CouponAnalyticsService
    ) {}
}
