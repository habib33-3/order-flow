import {
    Controller,
    Get,
    ParseDatePipe,
    ParseEnumPipe,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";

import { PlatformReviewAnalyticsService } from "./platform-review-analytics.service";

@Controller("review/platform/analytics")
export class PlatformReviewAnalyticsController {
    constructor(
        private readonly platformReviewAnalyticsService: PlatformReviewAnalyticsService
    ) {}

    @Get("summary")
    @ApiOperation({
        summary: "Get platform review summary",
        description:
            "Returns platform review statistics, optionally filtered by date range.",
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
    async getPlatformReviewSummary(
        @Query("startDate", ParseDatePipe)
        startDate?: Date,
        @Query("endDate", ParseDatePipe)
        endDate?: Date
    ) {
        return this.platformReviewAnalyticsService.getPlatformReviewSummary(
            startDate,
            endDate
        );
    }

    @Get("trend")
    @ApiOperation({
        summary: "Get platform review trend",
        description:
            "Returns the historical platform review trend grouped by month or year.",
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
    async getPlatformReviewTrend(
        @Query("startDate", ParseDatePipe)
        startDate?: Date,
        @Query("endDate", ParseDatePipe)
        endDate?: Date,
        @Query("interval", new ParseEnumPipe(["month", "year"] as const))
        interval: "month" | "year" = "month"
    ) {
        return this.platformReviewAnalyticsService.getPlatformReviewTrend(
            startDate,
            endDate,
            interval
        );
    }
}
