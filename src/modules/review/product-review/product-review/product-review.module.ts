import { Module } from "@nestjs/common";

import { ProductReviewController } from "./product-review.controller";
import { ProductReviewService } from "./product-review.service";

@Module({
    controllers: [ProductReviewController],
    providers: [ProductReviewService],
})
export class ProductReviewModule {}
