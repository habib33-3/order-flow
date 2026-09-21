import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    platformReviewAdminListCacheKey,
    platformReviewCacheKeyWithReviewId,
    platformReviewCacheKeyWithUserId,
    platformReviewUserCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma } from "src/generated/prisma/client";

import { ReviewQualityType } from "./constants";
import { CreatePlatformReviewDto } from "./dto/create-platform-review.dto";

@Injectable()
export class PlatformReviewService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisService
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

        const cachedReview = await this.cache.get(cacheKey);

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
}
