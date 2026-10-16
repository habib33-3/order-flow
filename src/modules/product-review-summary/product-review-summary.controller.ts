import { Controller, Get, Param } from "@nestjs/common";
import {
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from "@nestjs/swagger";

import { RateLimitPolicy } from "src/common/rate-limit/rate-limit.config";
import { RateLimit } from "src/common/rate-limit/rate-limit.decorator";

import { ProductReviewSummaryDto } from "./dto/product-review-summary.dto";
import { ProductReviewSummary } from "./product-review-summary.schema";
import { ProductReviewSummaryService } from "./product-review-summary.service";

@ApiTags("Product review summary")
@Controller("product-review-summary")
export class ProductReviewSummaryController {
    constructor(
        private readonly productReviewSummaryService: ProductReviewSummaryService
    ) {}

    @Get(":productId")
    @RateLimit(RateLimitPolicy.LLM)
    @ApiOperation({ summary: "Get the AI-generated product review summary" })
    @ApiParam({ name: "productId", type: String })
    @ApiOkResponse({
        type: ProductReviewSummaryDto,
        description:
            "The structured summary, or a generic fallback summary when insufficient reviews or generation is unavailable.",
    })
    async getSummary(
        @Param("productId") productId: string
    ): Promise<ProductReviewSummary> {
        return this.productReviewSummaryService.getSummary(productId);
    }
}
