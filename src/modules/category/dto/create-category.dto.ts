import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({
        example: "Electronics",
        description: "Category name",
    })
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
