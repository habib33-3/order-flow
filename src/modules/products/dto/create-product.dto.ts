import { ApiProperty } from "@nestjs/swagger";

import {
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    MinLength,
} from "class-validator";
import { ProductStatus } from "src/generated/prisma/enums";

export class CreateProductDto {
    @ApiProperty({
        example: "Wireless Mouse",
        description: "The name of the product.",
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @MinLength(2)
    name: string;

    @ApiProperty({
        example: "Ergonomic wireless mouse with adjustable DPI.",
        description: "A detailed description of the product.",
        minLength: 10,
    })
    @IsString()
    @MinLength(10)
    description: string;

    @ApiProperty({
        example: 29.99,
        description: "The price of the product. Must be greater than 0.",
        minimum: 0.01,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    price: number;

    @ApiProperty({
        example: 100,
        description: "The number of units currently available in stock.",
        minimum: 0,
    })
    @IsInt()
    @Min(0)
    stock: number;

    @ApiProperty({
        enum: ProductStatus,
        enumName: "ProductStatus",
        example: ProductStatus.ACTIVE,
        description: "The current status of the product.",
    })
    @IsEnum(ProductStatus)
    status: ProductStatus;

    @IsOptional()
    @ApiProperty({
        type: "string",
        format: "binary",
        description: "Product thumbnail image.",
    })
    thumbnail: Express.Multer.File;

    @IsOptional()
    @ApiProperty({
        type: "array",
        items: {
            type: "string",
            format: "binary",
        },
        description: "Additional product images.",
    })
    images: Express.Multer.File[];
}
