import {
    Controller,
    Get,
    Param,
    ParseDatePipe,
    ParseEnumPipe,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import { ProductReviewAnalyticsService } from "./product-review-analytics.service";

@Controller("review/product/analytics")
export class ProductReviewAnalyticsController {
    constructor(
        private readonly productReviewAnalyticsService: ProductReviewAnalyticsService
    ) {}

    @Get("summary/:productId")
    @ApiOperation({
        summary: "Get product review summary",
        description:
            "Returns product review statistics, optionally filtered by date range.",
    })
    @ApiParam({
        name: "productId",
        required: true,
        type: String,
    })
    @ApiQuery({
        name: "startDate",
        required: false,
        type: String,
        format: "date",
    })
    @ApiQuery({
        name: "endDate",
        required: false,
        type: String,
        format: "date",
    })
    async getProductReviewSummary(
        @Param("productId") productId: string,
        @Query("startDate", new ParseDatePipe({ optional: true }))
        startDate?: Date,
        @Query("endDate", new ParseDatePipe({ optional: true }))
        endDate?: Date
    ) {
        return this.productReviewAnalyticsService.getProductReviewSummary(
            productId,
            startDate,
            endDate
        );
    }

    @Get("trend/:productId")
    @ApiOperation({
        summary: "Get product review trend",
        description:
            "Returns the historical product review trend grouped by month or year.",
    })
    @ApiParam({
        name: "productId",
        required: true,
        type: String,
    })
    @ApiQuery({
        name: "startDate",
        required: false,
        type: String,
        format: "date",
        example: "2025-01-01",
    })
    @ApiQuery({
        name: "endDate",
        required: false,
        type: String,
        format: "date",
        example: "2026-09-23",
    })
    @ApiQuery({
        name: "interval",
        required: false,
        enum: ["month", "year"],
        example: "month",
    })
    async getProductReviewTrend(
        @Param("productId") productId: string,
        @Query("startDate", new ParseDatePipe({ optional: true }))
        startDate?: Date,
        @Query("endDate", new ParseDatePipe({ optional: true }))
        endDate?: Date,
        @Query("interval", new ParseEnumPipe(["month", "year"] as const))
        interval: "month" | "year" = "month"
    ) {
        return this.productReviewAnalyticsService.getProductReviewTrend(
            productId,
            startDate,
            endDate,
            interval
        );
    }
}
