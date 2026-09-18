import {
    Controller,
    DefaultValuePipe,
    Get,
    ParseEnumPipe,
    ParseIntPipe,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { AdminGuard } from "src/common/guards/admin.guard";

import { CouponAnalyticsService } from "./coupon-analytics.service";

@Controller("coupon-analytics")
export class CouponAnalyticsController {
    constructor(
        private readonly couponAnalyticsService: CouponAnalyticsService
    ) {}

    @Get("redemptions/me")
    @ApiOperation({
        summary: "Get authenticated user's redeemed coupon history",
        description:
            "Returns a paginated redemption history with optional coupon-code search and sorting by redemption date, code, or discount.",
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search coupons by code",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "code", "discount"],
        default: "createdAt",
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        default: "desc",
    })
    @ApiQuery({
        name: "page",
        required: false,
        type: Number,
        default: 1,
        minimum: 1,
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        default: 10,
        minimum: 1,
        maximum: 50,
    })
    async getMyCouponRedemptionHistory(
        @CurrentUser("sub") userId: string,
        @Query("search") search?: string,
        @Query(
            "sortBy",
            new ParseEnumPipe(
                {
                    createdAt: "createdAt",
                    code: "code",
                    discount: "discount",
                },
                { optional: true }
            )
        )
        sortBy?: "createdAt" | "code" | "discount",
        @Query("sort") sort?: "asc" | "desc",
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit?: number
    ) {
        return this.couponAnalyticsService.getMyCouponRedemptionHistory(
            userId,
            search,
            sortBy,
            sort,
            page,
            limit
        );
    }

    @AdminGuard()
    @Get("redemptions")
    @ApiOperation({
        summary: "Get all coupon redemption history",
        description:
            "Returns a paginated redemption history across all users with optional coupon-code search and sorting by redemption date, code, or discount.",
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search coupons by code",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "code", "discount"],
        default: "createdAt",
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        default: "desc",
    })
    @ApiQuery({
        name: "page",
        required: false,
        type: Number,
        default: 1,
        minimum: 1,
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        default: 10,
        minimum: 1,
        maximum: 50,
    })
    async getCouponRedemptionHistory(
        @Query("search") search?: string,
        @Query(
            "sortBy",
            new ParseEnumPipe(
                {
                    createdAt: "createdAt",
                    code: "code",
                    discount: "discount",
                },
                { optional: true }
            )
        )
        sortBy?: "createdAt" | "code" | "discount",
        @Query("sort") sort?: "asc" | "desc",
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit?: number
    ) {
        return this.couponAnalyticsService.getCouponRedemptionHistory(
            search,
            sortBy,
            sort,
            page,
            limit
        );
    }

    @AdminGuard()
    @Get("redemption-distribution/type")
    @ApiOperation({
        summary: "Get coupon redemption distribution by type",
        description:
            "Returns the number of coupon redemptions grouped by coupon type for the specified year. If no year is provided, the current year is used.",
    })
    @ApiQuery({
        name: "year",
        required: false,
        type: Number,
        description: "Calendar year to retrieve redemption distribution for.",
        example: 2026,
    })
    async getCouponRedemptionDistributionByType(
        @Query("year", new ParseIntPipe({ optional: true })) year?: number
    ) {
        return this.couponAnalyticsService.getCouponRedemptionDistributionByType(
            year
        );
    }
}
