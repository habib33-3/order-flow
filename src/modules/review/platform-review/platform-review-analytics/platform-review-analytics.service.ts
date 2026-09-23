import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    platformReviewSummaryCacheKey,
    platformReviewTrendCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class PlatformReviewAnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisService
    ) {}

    async getPlatformReviewSummary(startDate?: Date, endDate?: Date) {
        const cacheKey = platformReviewSummaryCacheKey(startDate, endDate);

        const cachedReviews = await this.cache.get(cacheKey);

        if (cachedReviews !== null) {
            return cachedReviews;
        }

        const where: Prisma.PlatformReviewWhereInput = {
            createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
            },
        };

        const [
            averageRating,
            averageRatingOverall,
            totalReviews,
            totalReviewsOverall,
            reviewBreakDown,
            reviewBreakDownOverall,
        ] = await Promise.all([
            this.prisma.platformReview.aggregate({
                where,
                _avg: {
                    rating: true,
                },
            }),

            this.prisma.platformReview.aggregate({
                _avg: {
                    rating: true,
                },
            }),

            this.prisma.platformReview.count({
                where,
            }),

            this.prisma.platformReview.count(),

            this.prisma.platformReview.groupBy({
                by: ["rating"],
                where,
                _count: {
                    rating: true,
                },
            }),

            this.prisma.platformReview.groupBy({
                by: ["rating"],
                _count: {
                    rating: true,
                },
            }),
        ]);

        const formatRatingBreakdown = (breakdown: typeof reviewBreakDown) =>
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
            reviewBreakDown: formatRatingBreakdown(reviewBreakDown),
            reviewBreakDownOverall: formatRatingBreakdown(
                reviewBreakDownOverall
            ),
        };

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getPlatformReviewTrend(
        startDate?: Date,
        endDate?: Date,
        interval: "month" | "year" = "month"
    ) {
        const cacheKey = platformReviewTrendCacheKey(
            startDate,
            endDate,
            interval
        );

        const cached = await this.cache.get(cacheKey);

        if (cached !== null) {
            return cached;
        }

        const where: Prisma.PlatformReviewWhereInput = {
            createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
            },
        };

        const reviews = await this.prisma.platformReview.findMany({
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
            const period =
                interval === "year"
                    ? review.createdAt.getUTCFullYear().toString()
                    : `${review.createdAt.getUTCFullYear()}-${String(
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
            averageRating: data.ratingTotal / data.count,
        }));

        await this.cache.set(cacheKey, result);

        return result;
    }

    async invalidatePlatformReviewAnalyticsCache() {
        await Promise.all([
            this.cache.delete(platformReviewTrendCacheKey()),
            this.cache.delete(platformReviewSummaryCacheKey()),
        ]);
    }
}
