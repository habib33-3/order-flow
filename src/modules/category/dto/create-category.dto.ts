import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({
        example: "Electronics",
        description: "Category name",
    })
    @Transform(({ value }) =>
        typeof value === "string" ? value.trim().toUpperCase() : value
    )
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        example: "Electronic devices and accessories",
        description: "Category description",
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @ApiProperty({
        type: "string",
        format: "binary",
        description: "Category image",
    })
    image: Express.Multer.File;
}
