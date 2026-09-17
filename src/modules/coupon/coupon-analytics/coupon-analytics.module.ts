import { Module } from "@nestjs/common";

import { CouponAnalyticsController } from "./coupon-analytics.controller";
import { CouponAnalyticsService } from "./coupon-analytics.service";

@Module({
    controllers: [CouponAnalyticsController],
    providers: [CouponAnalyticsService],
})
export class CouponAnalyticsModule {}
