import { Module } from "@nestjs/common";

import { ProductsModule } from "src/modules/products/products.module";

import { ProductReviewAnalyticsModule } from "../product-review-analytics/product-review-analytics.module";
import { ProductReviewController } from "./product-review.controller";
import { ProductReviewService } from "./product-review.service";

@Module({
    imports: [ProductReviewAnalyticsModule, ProductsModule],
    controllers: [ProductReviewController],
    providers: [ProductReviewService],
})
export class ProductReviewModule {}
