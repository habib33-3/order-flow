import { Module } from "@nestjs/common";

import { ProductReviewAnalyticsController } from "./product-review-analytics.controller";
import { ProductReviewAnalyticsService } from "./product-review-analytics.service";

@Module({
    controllers: [ProductReviewAnalyticsController],
    providers: [ProductReviewAnalyticsService],
    exports: [ProductReviewAnalyticsService],
})
export class ProductReviewAnalyticsModule {}
