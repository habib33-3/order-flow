import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { AdminGuard } from "src/common/guards/admin.guard";

import { AddProductReviewDto } from "./dto/add-product-review.dto";
import { ProductReviewService } from "./product-review.service";

@Controller("product-review")
export class ProductReviewController {
    constructor(private readonly productReviewService: ProductReviewService) {}

    @Post(":productId")
    @ApiOperation({
        summary: "Add a product review",
        description:
            "Creates a review for a product by the authenticated user.",
    })
    @ApiParam({
        name: "productId",
        type: String,
        description: "ID of the product to review",
        example: "cmj8x7k9p0001abc123def456",
    })
    async addProductReview(
        @Param("productId") productId: string,
        @Body() payload: AddProductReviewDto,
        @CurrentUser("sub") userId: string
    ) {
        return this.productReviewService.addProductReview(
            userId,
            productId,
            payload
        );
    }

    @Get("product/:productId")
    @ApiOperation({
        summary: "Get product reviews",
    })
    @ApiParam({
        name: "productId",
        description: "Product UUID",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @ApiQuery({
        name: "cursor",
        required: false,
        type: String,
        description: "Pagination cursor",
        example: "20",
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        description: "Number of reviews to return",
        example: 20,
        maximum: 50,
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search reviews by text",
        example: "excellent",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "rating", "userId"],
        example: "createdAt",
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        example: "desc",
    })
    @ApiQuery({
        name: "rating",
        required: false,
        type: Number,
        description: "Filter by rating",
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    async getProductReviews(
        @Param("productId") productId: string,

        @Query("cursor")
        cursor?: string,

        @Query(
            "limit",
            new ParseIntPipe({
                optional: true,
            })
        )
        limit?: number,

        @Query("search")
        search?: string,

        @Query("sortBy")
        sortBy?: "createdAt" | "rating" | "userId",

        @Query("sort")
        sort?: "asc" | "desc",

        @Query(
            "rating",
            new ParseIntPipe({
                optional: true,
            })
        )
        rating?: number
    ) {
        return this.productReviewService.getProductReviews(
            productId,
            cursor,
            limit,
            search,
            sortBy,
            sort,
            rating
        );
    }

    @Get("user/me")
    @ApiOperation({
        summary: "Get my submitted product reviews",
    })
    @ApiQuery({
        name: "cursor",
        required: false,
        type: String,
        description: "Pagination cursor",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        description: "Number of reviews to return",
        example: 20,
        maximum: 50,
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search reviews by text",
        example: "excellent",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "rating", "userId"],
        example: "createdAt",
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        example: "desc",
    })
    @ApiQuery({
        name: "rating",
        required: false,
        type: Number,
        description: "Filter by rating",
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    async getMySubmittedProductReviews(
        @CurrentUser("sub") userId: string,

        @Query("cursor")
        cursor?: string,

        @Query(
            "limit",
            new ParseIntPipe({
                optional: true,
            })
        )
        limit?: number,

        @Query("search")
        search?: string,

        @Query("sortBy")
        sortBy?: "createdAt" | "rating" | "userId",

        @Query("sort")
        sort?: "asc" | "desc",

        @Query(
            "rating",
            new ParseIntPipe({
                optional: true,
            })
        )
        rating?: number
    ) {
        return this.productReviewService.getProductReviewsByUserId(
            userId,
            cursor,
            limit,
            search,
            sortBy,
            sort,
            rating
        );
    }

    @AdminGuard()
    @Get("user/:userId")
    @ApiOperation({
        summary: "Get product reviews by user",
    })
    @ApiParam({
        name: "userId",
        description: "User UUID",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @ApiQuery({
        name: "cursor",
        required: false,
        type: String,
        description: "Pagination cursor",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        description: "Number of reviews to return",
        example: 20,
        maximum: 50,
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search reviews by text",
        example: "excellent",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "rating", "userId"],
        example: "createdAt",
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        example: "desc",
    })
    @ApiQuery({
        name: "rating",
        required: false,
        type: Number,
        description: "Filter by rating",
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    async getProductReviewsByUserId(
        @Param("userId") userId: string,

        @Query("cursor")
        cursor?: string,

        @Query(
            "limit",
            new ParseIntPipe({
                optional: true,
            })
        )
        limit?: number,

        @Query("search")
        search?: string,

        @Query("sortBy")
        sortBy?: "createdAt" | "rating" | "userId",

        @Query("sort")
        sort?: "asc" | "desc",

        @Query(
            "rating",
            new ParseIntPipe({
                optional: true,
            })
        )
        rating?: number
    ) {
        return this.productReviewService.getProductReviewsByUserId(
            userId,
            cursor,
            limit,
            search,
            sortBy,
            sort,
            rating
        );
    }

    @Get(":id")
    @ApiOperation({
        summary: "Get product review",
    })
    @ApiParam({
        name: "id",
        description: "Product review UUID",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    async getProductReview(@Param("id") id: string) {
        return this.productReviewService.getSingleProductReview(id);
    }
}
