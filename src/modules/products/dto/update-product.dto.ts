import { ApiPropertyOptional } from "@nestjs/swagger";

import {
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from "class-validator";
import { ProductStatus } from "src/generated/prisma/enums";

export class UpdateProductDto {
    @ApiPropertyOptional({
        description: "Product name",
        example: "iPhone 15 Pro",
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: "Detailed description of the product",
        example: "Apple iPhone 15 Pro with 256GB storage",
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: "Product price",
        example: 999.99,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price?: number;

    @ApiPropertyOptional({
        description: "Available stock quantity",
        example: 50,
        minimum: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({
        description: "Product status",
        enum: ProductStatus,
        example: ProductStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;
}
