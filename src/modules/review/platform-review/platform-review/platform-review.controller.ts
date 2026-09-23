import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { AdminGuard } from "src/common/guards/admin.guard";
import { type JwtPayload } from "src/types/types";

import { ReviewQuality, type ReviewQualityType } from "./constants";
import { CreatePlatformReviewDto } from "./dto/create-platform-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { PlatformReviewService } from "./platform-review.service";

@Controller("review/platform")
export class PlatformReviewController {
    constructor(
        private readonly platformReviewService: PlatformReviewService
    ) {}

    @Post()
    @ApiOperation({
        summary: "Add a platform review",
        description:
            "Allows an authenticated user to submit a review for the platform.",
    })
    async addPlatformReview(
        @Body() payload: CreatePlatformReviewDto,
        @CurrentUser("sub") userId: string
    ) {
        return this.platformReviewService.addPlatformReview(payload, userId);
    }

    @AdminGuard()
    @Get()
    @ApiOperation({
        summary: "Get all platform reviews",
        description: "Get paginated platform reviews for admin",
    })
    @ApiQuery({
        name: "cursor",
        required: false,
        type: String,
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        example: 20,
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
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
        example: 5,
    })
    @ApiQuery({
        name: "quality",
        required: false,
        enum: ["good", "bad", "neutral"],
    })
    async getAllPlatformReviews(
        @Query("cursor") cursor?: string,
        @Query(
            "limit",
            new DefaultValuePipe(20),
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })
        )
        limit?: number,
        @Query("search") search?: string,
        @Query("sort") sort: "asc" | "desc" = "desc",
        @Query(
            "rating",
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })
        )
        rating?: number,
        @Query("quality", new ParseEnumPipe(ReviewQuality))
        quality?: ReviewQualityType
    ) {
        return this.platformReviewService.getAllPlatformReviews(
            cursor,
            limit,
            search,
            sort,
            rating,
            quality
        );
    }

    @Public()
    @Get("featured")
    @ApiOperation({
        summary: "Get featured platform reviews",
        description: "Get the latest 5 highly rated platform reviews",
    })
    async getFeaturedPlatformReviews() {
        return this.platformReviewService.getPublicPlatformReviews();
    }

    @Get("me")
    @ApiOperation({
        summary: "Get the authenticated user's platform review",
        description:
            "Retrieve the platform review submitted by the currently authenticated user.",
    })
    async getPlatformReviewByUserId(@CurrentUser("sub") userId: string) {
        return this.platformReviewService.getPlatformReviewByUserId(userId);
    }

    @Get(":reviewId")
    @ApiOperation({
        summary: "Get a platform review by ID",
        description: "Retrieve a specific platform review using its review ID.",
    })
    @ApiParam({
        name: "reviewId",
        description: "Unique ID of the platform review",
        type: String,
    })
    async getPlatformReview(@Param("reviewId") reviewId: string) {
        return this.platformReviewService.getPlatformReview(reviewId);
    }

    @Patch()
    @ApiOperation({
        summary: "Update the authenticated user's platform review",
        description:
            "Update the platform review belonging to the currently authenticated user.",
    })
    async updatePlatformReview(
        @Body() payload: UpdateReviewDto,
        @CurrentUser("sub") userId: string
    ) {
        return this.platformReviewService.updateReview(userId, payload);
    }

    @Delete(":id")
    @ApiOperation({
        summary: "Delete a platform review",
        description:
            "Delete a platform review by ID. The review owner can delete their own review, while an admin can delete any review.",
    })
    @ApiParam({
        name: "id",
        description: "Unique ID of the platform review",
        type: String,
    })
    async deletePlatformReview(
        @CurrentUser() user: JwtPayload,
        @Param("id") id: string
    ) {
        return this.platformReviewService.deletePlatformReview(user, id);
    }
}
