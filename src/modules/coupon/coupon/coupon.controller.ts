import {
    Body,
    Controller,
    Get,
    Param,
    ParseEnumPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import { AdminGuard } from "src/common/guards/admin.guard";
import { CouponStatus } from "src/generated/prisma/enums";

import { CouponService } from "./coupon.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";

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

    @AdminGuard()
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

    @Get("/code/:code")
    @ApiOperation({
        summary: "Get coupon by code",
        description: "Retrieves a coupon by its code.",
    })
    @ApiParam({
        name: "code",
        required: true,
        type: String,
        description: "The coupon code to retrieve",
    })
    async getCouponByCode(@Param("code") code: string) {
        return this.couponService.getCouponByCode(code);
    }

    @AdminGuard()
    @Get("/:id")
    @ApiOperation({
        summary: "Get coupon by id",
        description: "Retrieves a coupon by its id.",
    })
    @ApiParam({
        name: "id",
        required: true,
        type: String,
        description: "The coupon id to retrieve",
    })
    async getCouponById(@Param("id") id: string) {
        return this.couponService.getCouponById(id);
    }

    @AdminGuard()
    @Patch(":id")
    @ApiOperation({
        summary: "Update coupon details",
        description: "Updates the configurable details of an existing coupon.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Unique identifier of the coupon to update",
    })
    async updateCoupon(
        @Param("id") id: string,
        @Body() payload: UpdateCouponDto
    ) {
        return this.couponService.updateCoupon(payload, id);
    }
}
