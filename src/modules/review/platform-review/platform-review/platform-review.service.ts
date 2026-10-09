import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    platformReviewAdminListCacheKey,
    platformReviewCacheKeyWithReviewId,
    platformReviewCacheKeyWithUserId,
    platformReviewUserCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { PlatformReview, Prisma } from "src/generated/prisma/client";
import { JwtPayload } from "src/types/types";

import { PlatformReviewAnalyticsService } from "../platform-review-analytics/platform-review-analytics.service";
import { ReviewQualityType } from "./constants";
import { CreatePlatformReviewDto } from "./dto/create-platform-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";

@Injectable()
export class PlatformReviewService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisService,
        private readonly analyticsService: PlatformReviewAnalyticsService
    ) {}

    async addPlatformReview(payload: CreatePlatformReviewDto, userId: string) {
        try {
            const review = await this.prisma.platformReview.create({
                data: {
                    userId,
                    rating: payload.rating,
                    review: payload.review.trim(),
                },
            });

            await Promise.all([
                this.cache.set(
                    platformReviewCacheKeyWithUserId(userId),
                    review
                ),
                this.cache.set(
                    platformReviewCacheKeyWithReviewId(review.id),
                    review
                ),

                this.analyticsService.invalidatePlatformReviewAnalyticsCache(),
            ]);

            return review;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new BadRequestException(
                    "You already have a review, you can edit it."
                );
            }

            throw error;
        }
    }

    getReviewQuality(rating: number): ReviewQualityType {
        if (rating <= 2) {
            return "bad";
        }

        if (rating === 3) {
            return "neutral";
        }

        return "good";
    }

    async getAllPlatformReviews(
        cursor?: string,
        limit = 20,
        search?: string,
        sort: "asc" | "desc" = "desc",
        rating?: number,
        quality?: ReviewQualityType
    ) {
        limit = Math.min(Math.max(limit, 1), 20);

        const cacheKey = platformReviewAdminListCacheKey(
            cursor,
            limit,
            search,
            "createdAt",
            sort,
            rating,
            quality
        );

        const cachedReviews = await this.cache.get(cacheKey);

        if (cachedReviews !== null) {
            return cachedReviews;
        }

        const where: Prisma.PlatformReviewWhereInput = {};

        if (search?.trim()) {
            const value = search.trim();

            where.OR = [
                {
                    review: {
                        contains: value,
                        mode: "insensitive",
                    },
                },
                {
                    user: {
                        email: {
                            contains: value,
                            mode: "insensitive",
                        },
                    },
                },
            ];
        }

        if (rating !== undefined) {
            where.rating = rating;
        } else if (quality === "bad") {
            where.rating = { lte: 2 };
        } else if (quality === "neutral") {
            where.rating = 3;
        } else if (quality === "good") {
            where.rating = { gte: 4 };
        }

        const reviews = await this.prisma.platformReview.findMany({
            where,
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: [{ createdAt: sort }, { id: sort }],
        });

        const [total, totalReviews] = await Promise.all([
            this.prisma.platformReview.count({ where }),
            this.prisma.platformReview.count(),
        ]);

        const result = {
            reviews,
            cursor:
                reviews.length === limit
                    ? reviews[reviews.length - 1].id
                    : undefined,
            total,
            totalReviews,
        };

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getPublicPlatformReviews() {
        const cacheKey = platformReviewUserCacheKey();

        const cachedReviews = await this.cache.get(cacheKey);

        if (cachedReviews !== null) {
            return cachedReviews;
        }

        const reviews = await this.prisma.platformReview.findMany({
            where: {
                rating: {
                    gte: 4,
                },
            },
            take: 5,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });

        await this.cache.set(cacheKey, reviews);

        return reviews;
    }

    async getPlatformReview(reviewId: string) {
        const cacheKey = platformReviewCacheKeyWithReviewId(reviewId);

        const cachedReview = await this.cache.get<
            Prisma.PlatformReviewGetPayload<{
                include: {
                    user: {
                        select: {
                            id: true;
                            email: true;
                            avatarUrl: true;
                        };
                    };
                };
            }>
        >(cacheKey);

        if (cachedReview !== null) {
            return cachedReview;
        }

        const review = await this.prisma.platformReview.findUnique({
            where: {
                id: reviewId,
            },
            select: {
                id: true,
                rating: true,
                review: true,
                userId: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        if (!review) {
            throw new NotFoundException("Platform review not found");
        }

        await this.cache.set(cacheKey, review);

        return review;
    }

    async getPlatformReviewByUserId(userId: string) {
        const cacheKey = platformReviewCacheKeyWithUserId(userId);

        const cachedReview = await this.cache.get<PlatformReview>(cacheKey);

        if (cachedReview !== null) {
            return cachedReview;
        }

        const review = await this.prisma.platformReview.findUnique({
            where: { userId },
        });

        if (!review) {
            throw new NotFoundException("No review found");
        }

        await this.cache.set(cacheKey, review);

        return review;
    }

    async updateReview(userId: string, payload: UpdateReviewDto) {
        const review = await this.getPlatformReviewByUserId(userId);

        const updateReview = await this.prisma.platformReview.update({
            where: {
                id: review.id,
            },
            data: {
                ...(payload.rating !== undefined && {
                    rating: payload.rating,
                }),
                ...(payload.review !== undefined && {
                    review: payload.review,
                }),
            },
        });

        await Promise.all([
            this.cache.set(
                platformReviewCacheKeyWithUserId(userId),
                updateReview
            ),
            this.cache.set(
                platformReviewCacheKeyWithReviewId(review.id),
                updateReview
            ),
            this.cache.delete(platformReviewAdminListCacheKey()),
            this.analyticsService.invalidatePlatformReviewAnalyticsCache(),
        ]);

        return updateReview;
    }

    async deletePlatformReview(user: JwtPayload, id: string) {
        const review = await this.getPlatformReview(id);

        const isAdmin = user.role === "ADMIN";
        const isOwner = review.userId === user.sub;

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException(
                "You are not authorized to delete this review"
            );
        }

        await this.prisma.platformReview.delete({
            where: {
                id: review.id,
            },
        });

        await Promise.all([
            this.cache.delete(platformReviewCacheKeyWithUserId(review.userId)),
            this.cache.delete(platformReviewCacheKeyWithReviewId(review.id)),
            this.cache.delete(platformReviewAdminListCacheKey()),
            this.analyticsService.invalidatePlatformReviewAnalyticsCache(),
        ]);

        return {
            message: "Review deleted successfully",
        };
    }
}
