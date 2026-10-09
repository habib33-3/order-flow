import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    productReviewSummaryCacheKey,
    productReviewTrendCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class ProductReviewAnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisService
    ) {}

    async getProductReviewSummary(
        productId: string,
        startDate?: Date,
        endDate?: Date
    ) {
        const cacheKey = productReviewSummaryCacheKey(
            productId,
            startDate,
            endDate
        );

        const cachedSummary = await this.cache.get(cacheKey);

        if (cachedSummary !== null) {
            return cachedSummary;
        }

        const dateFilter: Prisma.ProductReviewWhereInput = {
            ...(startDate && { createdAt: { gte: startDate } }),
            ...(endDate && {
                createdAt: {
                    ...(startDate && { gte: startDate }),
                    lte: endDate,
                },
            }),
        };

        const filteredWhere: Prisma.ProductReviewWhereInput = {
            productId,
            ...dateFilter,
        };

        const overallWhere: Prisma.ProductReviewWhereInput = {
            productId,
        };

        const [
            averageRating,
            averageRatingOverall,
            totalReviews,
            totalReviewsOverall,
            reviewBreakdown,
            reviewBreakdownOverall,
        ] = await Promise.all([
            this.prisma.productReview.aggregate({
                where: filteredWhere,
                _avg: {
                    rating: true,
                },
            }),

            this.prisma.productReview.aggregate({
                where: overallWhere,
                _avg: {
                    rating: true,
                },
            }),

            this.prisma.productReview.count({
                where: filteredWhere,
            }),

            this.prisma.productReview.count({
                where: overallWhere,
            }),

            this.prisma.productReview.groupBy({
                by: ["rating"],
                where: filteredWhere,
                _count: {
                    rating: true,
                },
            }),

            this.prisma.productReview.groupBy({
                by: ["rating"],
                where: overallWhere,
                _count: {
                    rating: true,
                },
            }),
        ]);

        const formatRatingBreakdown = (breakdown: typeof reviewBreakdown) =>
            [1, 2, 3, 4, 5].map((rating) => ({
                rating,
                count:
                    breakdown.find((item) => item.rating === rating)?._count
                        .rating ?? 0,
            }));

        const result = {
            averageRating: averageRating._avg.rating,
            averageRatingOverall: averageRatingOverall._avg.rating,
            totalReviews,
            totalReviewsOverall,
            reviewBreakdown: formatRatingBreakdown(reviewBreakdown),
            reviewBreakdownOverall: formatRatingBreakdown(
                reviewBreakdownOverall
            ),
        };

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getProductReviewTrend(
        productId: string,
        startDate?: Date,
        endDate?: Date,
        interval: "month" | "year" = "month"
    ) {
        const cacheKey = productReviewTrendCacheKey(
            productId,
            startDate,
            endDate,
            interval
        );

        const cached = await this.cache.get(cacheKey);

        if (cached !== null) {
            return cached;
        }

        const createdAt =
            startDate || endDate
                ? {
                      ...(startDate && { gte: startDate }),
                      ...(endDate && { lte: endDate }),
                  }
                : undefined;

        const where: Prisma.ProductReviewWhereInput = {
            productId,
            ...(createdAt && { createdAt }),
        };

        const reviews = await this.prisma.productReview.findMany({
            where,
            select: {
                rating: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const trend = new Map<
            string,
            {
                count: number;
                ratingTotal: number;
            }
        >();

        for (const review of reviews) {
            const year = review.createdAt.getUTCFullYear();

            const period =
                interval === "year"
                    ? year.toString()
                    : `${year}-${String(
                          review.createdAt.getUTCMonth() + 1
                      ).padStart(2, "0")}`;

            const current = trend.get(period) ?? {
                count: 0,
                ratingTotal: 0,
            };

            current.count += 1;
            current.ratingTotal += review.rating;

            trend.set(period, current);
        }

        const result = Array.from(trend.entries()).map(([period, data]) => ({
            period,
            count: data.count,
            averageRating: Number((data.ratingTotal / data.count).toFixed(2)),
        }));

        await this.cache.set(cacheKey, result);

        return result;
    }

    async invalidateProductReviewAnalyticsCache(productId: string) {
        await Promise.all([
            this.cache.delete(productReviewTrendCacheKey(productId)),
            this.cache.delete(productReviewSummaryCacheKey(productId)),
        ]);
    }
}
