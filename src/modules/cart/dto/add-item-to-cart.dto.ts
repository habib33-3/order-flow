import { ApiProperty } from "@nestjs/swagger";

import { IsNotEmpty, IsString } from "class-validator";

export class AddItemToCartDto {
    @ApiProperty({
        example: "cm123abc456",
        description: "ID of the product to add to the cart",
    })
    @IsString()
    @IsNotEmpty()
    productId: string;
}
