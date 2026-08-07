import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCategoryDto {
    @ApiPropertyOptional({
        example: "Electronic devices and accessories.",
        description: "Category description",
    })
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === "string" ? value.trim() : value
    )
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @ApiPropertyOptional({
        type: "string",
        format: "binary",
        description: "Category image",
    })
    image?: Express.Multer.File;
}
