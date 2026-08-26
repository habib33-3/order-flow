import { randomBytes } from "node:crypto";

import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { CouponType } from "src/generated/prisma/enums";

import { CreateCouponDto } from "./dto/create-coupon.dto";

@Injectable()
export class CouponService {
    constructor(private readonly prisma: PrismaService) {}

    private validateCouponCreation(
        payload: CreateCouponDto,
        discount: Prisma.Decimal
    ) {
        if (payload.maxLimitPerUser > payload.maxLimit) {
            throw new BadRequestException(
                "maxLimitPerUser cannot be greater than maxLimit"
            );
        }

        if (
            payload.type === CouponType.FIXED &&
            payload.maximumDiscountAmount !== undefined
        ) {
            throw new BadRequestException(
                "Maximum discount amount is only applicable to percentage coupons."
            );
        }

        if (
            payload.type === CouponType.PERCENTAGE &&
            discount.greaterThan(100)
        ) {
            throw new BadRequestException(
                "Percentage discount cannot exceed 100."
            );
        }

        if (payload.startAt >= payload.endAt) {
            throw new BadRequestException(
                "startAt must be earlier than endAt."
            );
        }
    }

    private generateCouponCode() {
        return randomBytes(5).toString("hex").toUpperCase();
    }

    async createCoupon(payload: CreateCouponDto) {
        const discount = new Prisma.Decimal(payload.discount);

        this.validateCouponCreation(payload, discount);

        const code = this.generateCouponCode();

        const minimumOrderAmount = payload.minimumOrderAmount
            ? new Prisma.Decimal(payload.minimumOrderAmount)
            : undefined;

        const maximumDiscountAmount = payload.maximumDiscountAmount
            ? new Prisma.Decimal(payload.maximumDiscountAmount)
            : undefined;

        return this.prisma.coupon.create({
            data: {
                type: payload.type,
                code,
                discount,
                startAt: payload.startAt,
                endAt: payload.endAt,
                minimumOrderAmount,
                maximumDiscountAmount,
                maxLimit: payload.maxLimit,
                maxLimitPerUser: payload.maxLimitPerUser,
                remainingLimit: payload.maxLimit,
            },
        });
    }
}
