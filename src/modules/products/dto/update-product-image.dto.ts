import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsUrl } from "class-validator";

export class UpdateProductImageDto {
    @ApiPropertyOptional({
        type: [String],
        description: "Image URLs to remove.",
        example: [
            "https://res.cloudinary.com/demo/image/upload/v1/products/image1.jpg",
            "https://res.cloudinary.com/demo/image/upload/v1/products/image2.jpg",
        ],
    })
    @Transform(({ value }) => {
        if (value === null) return undefined;

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                return [value];
            }
        }

        return Array.isArray(value) ? value : [value];
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsUrl({ require_protocol: true }, { each: true })
    removedImages?: string[];

    @IsOptional()
    @ApiPropertyOptional({
        type: "array",
        items: {
            type: "string",
            format: "binary",
        },
        description: "Additional product images.",
    })
    images?: Express.Multer.File[];
}
