import { ApiProperty } from "@nestjs/swagger";

import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class AddProductReviewDto {
    @ApiProperty({
        example: "Great product, really satisfied with the quality.",
        description: "Product review content",
    })
    @IsString()
    @IsNotEmpty()
    review!: string;

    @ApiProperty({
        example: 5,
        description: "Product rating from 1 to 5",
        minimum: 1,
        maximum: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;
}
