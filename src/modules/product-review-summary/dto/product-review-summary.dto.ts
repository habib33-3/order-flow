import { ApiProperty } from "@nestjs/swagger";

import { ProductReviewSummary } from "../product-review-summary.schema";

export class ProductReviewSummaryDto implements ProductReviewSummary {
    @ApiProperty({
        description: "Concise summary of the product review feedback.",
        maxLength: 600,
    })
    summary!: string;

    @ApiProperty({
        enum: ["positive", "mixed", "negative", "insufficient_data"],
    })
    sentiment!: ProductReviewSummary["sentiment"];

    @ApiProperty({ type: [String], maxItems: 5 })
    praises!: string[];

    @ApiProperty({ type: [String], maxItems: 5 })
    complaints!: string[];
}
