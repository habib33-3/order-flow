import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    productReviewCacheKeyWithId,
    productReviewListCacheKey,
    productReviewListCacheKeyWithUserId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma } from "src/generated/prisma/client";
import { ProductsService } from "src/modules/products/products.service";
import { JwtPayload } from "src/types/types";

import { ProductReviewAnalyticsService } from "../product-review-analytics/product-review-analytics.service";
import { UpdateProductReviewDto } from "./dto/update-product-review.dto";

@Injectable()
export class ProductReviewService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly productService: ProductsService,
        private readonly cache: RedisService,
        private readonly productReviewAnalyticsService: ProductReviewAnalyticsService
    ) {}

    async addProductReview(
        userId: string,
        productId: string,
        AddProductReviewDto
    ) {
        await this.productService.getProductById(productId);

        const existingReview = await this.prisma.productReview.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (existingReview) {
            throw new BadRequestException(
                "Review already exists for this product"
            );
        }

        const productReview = await this.prisma.productReview.create({
            data: {
                userId,
                productId,
                rating: AddProductReviewDto.rating,
                review: AddProductReviewDto.review,
            },
        });

        await Promise.all([
            this.cache.set(
                productReviewCacheKeyWithId(productReview.id),
                productReview
            ),
            this.cache.delete(productReviewListCacheKey(productId)),
            this.cache.delete(productReviewListCacheKeyWithUserId(userId)),
            this.productReviewAnalyticsService.invalidateProductReviewAnalyticsCache(
                productId
            ),
        ]);

        return productReview;
    }

    async getProductReviews(
        productId: string,
        cursor?: string,
        limit = 20,
        search?: string,
        sortBy: "createdAt" | "rating" | "userId" = "createdAt",
        sort: "asc" | "desc" = "desc",
        rating?: number
    ) {
        limit = Math.min(limit, 50);

        const normalizedSearch = search?.trim();

        const cacheKey = productReviewListCacheKey(
            productId,
            cursor,
            limit,
            normalizedSearch,
            sortBy,
            sort,
            rating
        );

        const cached = await this.cache.get(cacheKey);

        if (cached !== null) {
            return cached;
        }

        const where: Prisma.ProductReviewWhereInput = {
            productId,
        };

        if (normalizedSearch) {
            where.review = {
                contains: normalizedSearch,
                mode: "insensitive",
            };
        }

        if (rating !== undefined) {
            where.rating = rating;
        }

        const [averageRating, totalReviews, reviews] = await Promise.all([
            this.prisma.productReview.aggregate({
                where: { productId },
                _avg: { rating: true },
            }),

            this.prisma.productReview.count({
                where: { productId },
            }),

            this.prisma.productReview.findMany({
                where,
                take: limit + 1,
                ...(cursor && {
                    cursor: {
                        id: cursor,
                    },
                    skip: 1,
                }),
                orderBy: {
                    id: sort,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

        const hasNextPage = reviews.length > limit;
        const pageReviews = reviews.slice(0, limit);

        const result = {
            reviews: pageReviews,
            averageRating: averageRating._avg.rating ?? 0,
            totalReviews,
            nextCursor: hasNextPage ? pageReviews.at(-1)?.id : undefined,
        };

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getProductReviewsByUserId(
        userId: string,
        cursor?: string,
        limit = 20,
        search?: string,
        sortBy: "createdAt" | "rating" | "userId" = "createdAt",
        sort: "asc" | "desc" = "desc",
        rating?: number
    ) {
        limit = Math.min(limit, 50);

        const cacheKey = productReviewListCacheKeyWithUserId(
            userId,
            cursor,
            limit,
            search,
            sortBy,
            sort,
            rating
        );

        const cached = await this.cache.get(cacheKey);

        if (cached !== null) {
            return cached;
        }

        const where: Prisma.ProductReviewWhereInput = {
            userId,
        };

        if (search) {
            search = search.trim();

            where.review = {
                contains: search,
                mode: "insensitive",
            };
        }

        if (rating) {
            where.rating = rating;
        }

        const totalReviews = await this.prisma.productReview.count({
            where,
        });

        const productReviews = await this.prisma.productReview.findMany({
            where,
            take: limit + 1,
            ...(cursor && {
                cursor: {
                    id: cursor,
                },
                skip: 1,
            }),
            orderBy: {
                [sortBy]: sort,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const hasNextPage = productReviews.length > limit;
        const pageReviews = productReviews.slice(0, limit);

        const result = {
            reviews: pageReviews,
            totalReviews,
            nextCursor: hasNextPage ? pageReviews.at(-1)?.id : undefined,
        };

        await this.cache.set(cacheKey, result);

        return result;
    }

    async getSingleProductReview(id: string) {
        const key = productReviewCacheKeyWithId(id);

        const cached = await this.cache.get<
            Prisma.ProductReviewGetPayload<{
                select: {
                    id: true;
                    rating: true;
                    review: true;
                    createdAt: true;
                    updatedAt: true;
                    user: {
                        select: {
                            id: true;
                            name: true;
                            avatarUrl: true;
                        };
                    };
                    product: {
                        select: {
                            id: true;
                            name: true;
                            thumbnail: true;
                        };
                    };
                };
            }>
        >(key);

        if (cached !== null) {
            return cached;
        }

        const productReview = await this.prisma.productReview.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                rating: true,
                review: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        thumbnail: true,
                    },
                },
            },
        });

        if (!productReview) {
            throw new NotFoundException("Product review not found");
        }

        await this.cache.set(key, productReview);

        return productReview;
    }

    async updateProductReview(
        userId: string,
        reviewId: string,
        payload: UpdateProductReviewDto
    ) {
        const productReview = await this.getSingleProductReview(reviewId);

        if (productReview.user.id !== userId) {
            throw new ForbiddenException(
                "You can only update your own reviews"
            );
        }

        const updateReview = await this.prisma.productReview.update({
            where: {
                id: reviewId,
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
            this.cache.delete(productReviewCacheKeyWithId(reviewId)),
            this.cache.delete(
                productReviewListCacheKey(productReview.product.id)
            ),
            this.cache.delete(productReviewListCacheKeyWithUserId(userId)),
            this.productReviewAnalyticsService.invalidateProductReviewAnalyticsCache(
                productReview.product.id
            ),
        ]);

        return updateReview;
    }

    async deleteProductReview(user: JwtPayload, id: string) {
        const review = await this.getSingleProductReview(id);

        const isAdmin = user.role === "ADMIN";
        const isOwner = review.user.id === user.sub;

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException(
                "You are not authorized to delete this review"
            );
        }

        await this.prisma.productReview.delete({
            where: {
                id: review.id,
            },
        });

        await Promise.all([
            this.cache.delete(productReviewCacheKeyWithId(id)),
            this.cache.delete(productReviewListCacheKey(review.product.id)),
            this.cache.delete(
                productReviewListCacheKeyWithUserId(review.user.id)
            ),
            this.productReviewAnalyticsService.invalidateProductReviewAnalyticsCache(
                review.product.id
            ),
        ]);

        return {
            message: "Review deleted successfully",
        };
    }
}
