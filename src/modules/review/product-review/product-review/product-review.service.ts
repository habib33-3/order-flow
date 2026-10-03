import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    productReviewCacheKeyWithId,
    productReviewListCacheKey,
    productReviewListCacheKeyWithUserId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { ProductsService } from "src/modules/products/products.service";

@Injectable()
export class ProductReviewService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly productService: ProductsService,
        private readonly cache: RedisService
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
        ]);

        return productReview;
    }
}
