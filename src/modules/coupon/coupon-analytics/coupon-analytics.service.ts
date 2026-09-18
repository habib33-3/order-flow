import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    couponDistributionByTypeCacheKey,
    couponRedemptionsCacheKey,
    userCouponRedemptionsCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { CouponType, Prisma } from "src/generated/prisma/client";

@Injectable()
export class CouponAnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisService
    ) {}

    private async getCouponRedemptionHistoryBase(
        userId?: string,
        search?: string,
        sortBy: "createdAt" | "code" | "discount" = "createdAt",
        sort: "asc" | "desc" = "desc",
        page = 1,
        limit = 10
    ) {
        const where: Prisma.CouponRedeemWhereInput = {};

        if (userId) {
            where.userId = userId;
        }

        if (search) {
            where.coupon = {
                code: {
                    contains: search,
                    mode: "insensitive",
                },
            };
        }

        const skip = (page - 1) * limit;

        const [data, total, totalCount] = await Promise.all([
            this.prisma.couponRedeem.findMany({
                where,
                include: {
                    coupon: true,
                },
                orderBy:
                    sortBy === "createdAt"
                        ? { createdAt: sort }
                        : {
                              coupon: {
                                  [sortBy]: sort,
                              },
                          },
                skip,
                take: limit,
            }),

            this.prisma.couponRedeem.count({ where }),

            userId
                ? this.prisma.couponRedeem.count({
                      where: { userId },
                  })
                : this.prisma.couponRedeem.count(),
        ]);

        const result = {
            data: {
                totalRedeemed: totalCount,
                data,
            },
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        return result;
    }

    async getMyCouponRedemptionHistory(
        userId: string,
        search?: string,
        sortBy: "createdAt" | "code" | "discount" = "createdAt",
        sort: "asc" | "desc" = "desc",
        page = 1,
        limit = 10
    ) {
        limit = Math.min(limit, 50);

        const cacheKey = userCouponRedemptionsCacheKey(
            userId,
            search,
            sortBy,
            sort,
            page,
            limit
        );

        const cachedData = await this.cache.get(cacheKey);

        if (cachedData !== null) {
            return cachedData;
        }

        const result = await this.getCouponRedemptionHistoryBase(
            userId,
            search,
            sortBy,
            sort,
            page,
            limit
        );

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getCouponRedemptionHistory(
        search?: string,
        sortBy: "createdAt" | "code" | "discount" = "createdAt",
        sort: "asc" | "desc" = "desc",
        page = 1,
        limit = 10
    ) {
        limit = Math.min(limit, 50);

        const cacheKey = couponRedemptionsCacheKey(
            search,
            sortBy,
            sort,
            page,
            limit
        );

        const cachedData = await this.cache.get(cacheKey);

        if (cachedData !== null) {
            return cachedData;
        }

        const result = await this.getCouponRedemptionHistoryBase(
            undefined,
            search,
            sortBy,
            sort,
            page,
            limit
        );

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getCouponRedemptionDistributionByType(year?: number) {
        year ??= new Date().getFullYear();

        const key = couponDistributionByTypeCacheKey(year);

        const cachedData = await this.cache.get(key);

        if (cachedData !== null) {
            return cachedData;
        }

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const data = await this.prisma.$queryRaw<
            { type: CouponType; count: number }[]
        >`
        SELECT
            c.type,
            COUNT(cr.id)::int AS count
        FROM "CouponRedeem" cr
        INNER JOIN "Coupon" c
            ON c.id = cr."couponId"
        WHERE cr."createdAt" >= ${startDate}
          AND cr."createdAt" < ${endDate}
        GROUP BY c.type
        ORDER BY count DESC
    `;

        await this.cache.set(key, data);

        return data;
    }

    async invalidateCouponAnalyticsCache(userId: string) {
        await Promise.all([
            this.cache.delete(couponRedemptionsCacheKey()),
            this.cache.delete(userCouponRedemptionsCacheKey(userId)),
            this.cache.delete(
                couponDistributionByTypeCacheKey(new Date().getFullYear())
            ),
        ]);
    }
}
