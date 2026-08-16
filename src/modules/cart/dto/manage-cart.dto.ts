import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsNotEmpty,
    IsPositive,
    IsString,
    ValidateNested,
} from "class-validator";

class CartItemDto {
    @ApiProperty({
        description: "Product ID",
        example: "cm123abc456",
    })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({
        description: "Quantity of the product",
        example: 2,
        minimum: 1,
    })
    @IsInt()
    @IsPositive()
    quantity: number;
}

export class ManageCartDto {
    @ApiProperty({
        description: "Cart items to update",
        type: [CartItemDto],
        example: [
            {
                productId: "cm123abc456",
                quantity: 2,
            },
            {
                productId: "cm789xyz123",
                quantity: 1,
            },
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    items: CartItemDto[];
}
