import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateProductReviewDto {
    @ApiPropertyOptional({
        description: "Rating given to the product",
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({
        description: "Review content",
        example: "Great product with a smooth user experience.",
    })
    @IsOptional()
    @IsString()
    review?: string;
}
