import { Module } from "@nestjs/common";

import { PlatformReviewAnalyticsController } from "./platform-review-analytics.controller";
import { PlatformReviewAnalyticsService } from "./platform-review-analytics.service";

@Module({
    controllers: [PlatformReviewAnalyticsController],
    providers: [PlatformReviewAnalyticsService],
    exports: [PlatformReviewAnalyticsService],
})
export class PlatformReviewAnalyticsModule {}
