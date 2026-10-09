import { ApiProperty } from "@nestjs/swagger";

import {
    IsInt,
    IsNotEmpty,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";

export class CreatePlatformReviewDto {
    @ApiProperty({
        description: "The review content",
        example: "Great shopping experience and fast delivery.",
        minLength: 10,
        maxLength: 1000,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    review!: string;

    @ApiProperty({
        description: "Platform rating from 1 to 5",
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;
}
