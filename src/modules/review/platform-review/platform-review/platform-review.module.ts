import { Module } from "@nestjs/common";

import { PlatformReviewAnalyticsModule } from "../platform-review-analytics/platform-review-analytics.module";
import { PlatformReviewController } from "./platform-review.controller";
import { PlatformReviewService } from "./platform-review.service";

@Module({
    imports: [PlatformReviewAnalyticsModule],
    controllers: [PlatformReviewController],
    providers: [PlatformReviewService],
})
export class PlatformReviewModule {}
