import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    platformReviewCacheKeyWithReviewId,
    platformReviewCacheKeyWithUserId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma } from "src/generated/prisma/client";

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
}
