import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { AdminGuard } from "src/common/guards/admin.guard";

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
}
