import { Module } from "@nestjs/common";

import { ProductReviewSummaryController } from "./product-review-summary.controller";
import { ProductReviewSummaryService } from "./product-review-summary.service";

@Module({
    controllers: [ProductReviewSummaryController],
    providers: [ProductReviewSummaryService],
})
export class ProductReviewSummaryModule {}
