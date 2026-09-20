import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { CreatePlatformReviewDto } from "./dto/create-platform-review.dto";
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
}
