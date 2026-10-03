import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiParam } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

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
}
