import { randomBytes } from "node:crypto";

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { Decimal } from "@prisma/client/runtime/client";
import { PrismaService } from "src/common/prisma/prisma.service";
import {
    couponCacheKeyWithCode,
    couponCacheKeyWithId,
    couponListCache,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Coupon, Prisma } from "src/generated/prisma/client";
import { CouponStatus, CouponType } from "src/generated/prisma/enums";

import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";

@Injectable()
export class CouponService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisService
    ) {}

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

        const coupon = await this.prisma.coupon.create({
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

        await Promise.all([
            this.cache.set(couponCacheKeyWithCode(code), coupon),
            this.cache.set(couponCacheKeyWithId(coupon.id), coupon),
            this.cache.delete(couponListCache()),
        ]);

        return coupon;
    }

    async getCoupons(
        search?: string,
        sortBy?: "createdAt" | "discount" | "maxLimit",
        sort?: "asc" | "desc",
        filter?: CouponStatus
    ) {
        const key = couponListCache(search, sortBy, sort, filter);

        const cachedCoupons = await this.cache.get(key);

        if (cachedCoupons !== null) {
            return cachedCoupons;
        }

        const where: Prisma.CouponWhereInput = {};

        if (search) {
            search = search.trim();
            where.code = {
                contains: search,
                mode: "insensitive",
            };
        }

        if (filter) {
            where.status = filter;
        }

        const coupons = await this.prisma.coupon.findMany({
            where,
            orderBy: sortBy
                ? {
                      [sortBy]: sort ?? "desc",
                  }
                : {
                      createdAt: "desc",
                  },
        });

        await this.cache.set(key, coupons);

        return coupons;
    }

    async getCouponByCode(code: string) {
        const key = couponCacheKeyWithCode(code);

        const cachedCoupon = await this.cache.get<{
            id: string;
            type: CouponType;
            code: string;
            discount: Decimal;
            startAt: Date;
            endAt: Date;
            minimumOrderAmount: Decimal | null;
            maximumDiscountAmount: Decimal | null;
        }>(key);

        if (cachedCoupon !== null) {
            return cachedCoupon;
        }

        const coupon = await this.prisma.coupon.findUnique({
            where: { code },
            select: {
                id: true,
                type: true,
                code: true,
                discount: true,
                startAt: true,
                endAt: true,
                minimumOrderAmount: true,
                maximumDiscountAmount: true,
            },
        });

        if (!coupon) {
            throw new NotFoundException("Coupon not found");
        }

        const now = new Date();

        if (now < coupon.startAt) {
            throw new BadRequestException("Coupon is not active yet");
        }

        if (now > coupon.endAt) {
            throw new BadRequestException("Coupon has expired");
        }

        await this.cache.set(key, coupon);

        return coupon;
    }

    async getCouponById(id: string) {
        const key = couponCacheKeyWithId(id);

        const cachedCoupon = await this.cache.get<Coupon>(key);

        if (cachedCoupon !== null) {
            return cachedCoupon;
        }

        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
        });

        if (!coupon) {
            throw new NotFoundException("Coupon not found");
        }

        await this.cache.set(key, coupon);

        return coupon;
    }

    async updateCoupon(payload: UpdateCouponDto, id: string) {
        const coupon = await this.getCouponById(id);

        const redeemedCount = coupon.maxLimit - coupon.remainingLimit;

        if (
            payload.maxLimit !== undefined &&
            payload.maxLimit < redeemedCount
        ) {
            throw new BadRequestException(
                "Maximum limit cannot be less than the number of redeemed coupons"
            );
        }

        if (
            payload.maxLimitPerUser !== undefined &&
            payload.maxLimitPerUser > (payload.maxLimit ?? coupon.maxLimit)
        ) {
            throw new BadRequestException(
                "Maximum limit per user cannot exceed the maximum coupon limit"
            );
        }

        const startAt = payload.startAt ?? coupon.startAt;
        const endAt = payload.endAt ?? coupon.endAt;

        if (startAt >= endAt) {
            throw new BadRequestException("Start date must be before end date");
        }

        const updateData: Prisma.CouponUncheckedUpdateInput = {};

        if (payload.startAt !== undefined) {
            updateData.startAt = payload.startAt;
        }

        if (payload.endAt !== undefined) {
            updateData.endAt = payload.endAt;
        }

        if (payload.minimumOrderAmount !== undefined) {
            updateData.minimumOrderAmount = payload.minimumOrderAmount;
        }

        if (payload.maximumDiscountAmount !== undefined) {
            updateData.maximumDiscountAmount = payload.maximumDiscountAmount;
        }

        if (payload.status !== undefined) {
            updateData.status = payload.status;
        }

        if (payload.maxLimit !== undefined) {
            updateData.maxLimit = payload.maxLimit;
            updateData.remainingLimit = payload.maxLimit - redeemedCount;
        }

        if (payload.maxLimitPerUser !== undefined) {
            updateData.maxLimitPerUser = payload.maxLimitPerUser;
        }

        await this.prisma.coupon.update({
            where: { id: coupon.id },
            data: updateData,
        });

        await Promise.all([
            this.cache.set(couponCacheKeyWithCode(coupon.code), coupon),
            this.cache.set(couponCacheKeyWithId(coupon.id), coupon),
            this.cache.delete(couponListCache()),
        ]);
    }

    async redeemCoupon(
        code: string,
        userId: string,
        totalAmount: number,
        tx: Prisma.TransactionClient
    ) {
        const coupon = await tx.coupon.findUnique({
            where: { code },
        });

        if (!coupon) {
            throw new BadRequestException("Coupon not found");
        }

        const now = new Date();

        if (coupon.status !== CouponStatus.ACTIVE) {
            throw new BadRequestException("Coupon is not active");
        }

        if (now < coupon.startAt || now > coupon.endAt) {
            throw new BadRequestException("Coupon is not available");
        }

        if (coupon.remainingLimit <= 0) {
            throw new BadRequestException("Coupon is fully redeemed");
        }

        if (
            coupon.minimumOrderAmount &&
            totalAmount < Number(coupon.minimumOrderAmount)
        ) {
            throw new BadRequestException(
                `Minimum order amount is ${coupon.minimumOrderAmount}`
            );
        }

        const userRedeemCount = await tx.couponRedeem.count({
            where: {
                couponId: coupon.id,
                userId,
            },
        });

        if (userRedeemCount >= coupon.maxLimitPerUser) {
            throw new BadRequestException(
                "You have reached the redemption limit for this coupon"
            );
        }

        const discount =
            coupon.type === CouponType.PERCENTAGE
                ? Math.min(
                      (totalAmount * Number(coupon.discount)) / 100,
                      coupon.maximumDiscountAmount
                          ? Number(coupon.maximumDiscountAmount)
                          : Infinity
                  )
                : Math.min(Number(coupon.discount), totalAmount);

        const updated = await tx.coupon.updateMany({
            where: {
                id: coupon.id,
                remainingLimit: {
                    gt: 0,
                },
            },
            data: {
                remainingLimit: {
                    decrement: 1,
                },
            },
        });

        if (updated.count === 0) {
            throw new BadRequestException("Coupon is fully redeemed");
        }

        await tx.couponRedeem.create({
            data: {
                couponId: coupon.id,
                userId,
            },
        });

        return {
            couponId: coupon.id,
            code: coupon.code,
            discount: new Prisma.Decimal(discount),
            finalAmount: totalAmount - discount,
        };
    }
}
