import {
    Body,
    Controller,
    Get,
    ParseEnumPipe,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";

import { AdminGuard } from "src/common/guards/admin.guard";
import { CouponStatus } from "src/generated/prisma/enums";

import { CouponService } from "./coupon.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";

@Controller("coupon")
export class CouponController {
    constructor(private readonly couponService: CouponService) {}

    @AdminGuard()
    @Post()
    @ApiOperation({
        summary: "Create a new coupon",
        description:
            "Creates a new coupon with a randomly generated coupon code.",
    })
    async createCoupon(@Body() payload: CreateCouponDto) {
        return this.couponService.createCoupon(payload);
    }

    @Get()
    @ApiOperation({
        summary: "Get all coupons",
        description:
            "Retrieves a list of coupons with optional search, filtering, and sorting.",
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
        enum: ["createdAt", "discount", "maxLimit"],
        description: "Field to sort by",
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        description: "Sort direction",
    })
    @ApiQuery({
        name: "filter",
        required: false,
        enum: CouponStatus,
        description: "Filter coupons by status",
    })
    async getCoupons(
        @Query("search") search?: string,

        @Query(
            "sortBy",
            new ParseEnumPipe(["createdAt", "discount", "maxLimit"], {
                optional: true,
            })
        )
        sortBy?: "createdAt" | "discount" | "maxLimit",

        @Query("sort", new ParseEnumPipe(["asc", "desc"], { optional: true }))
        sort?: "asc" | "desc",

        @Query("filter", new ParseEnumPipe(CouponStatus, { optional: true }))
        filter?: CouponStatus
    ) {
        return this.couponService.getCoupons(search, sortBy, sort, filter);
    }
}
