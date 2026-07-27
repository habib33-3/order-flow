import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsPositive,
    IsString,
    ValidateNested,
} from "class-validator";
import { PaymentProvider } from "src/generated/prisma/enums";

export class OrderItemDto {
    @ApiProperty({
        description: "The ID of the product to add to the order.",
        example: "cm123abc456def",
    })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({
        description: "The quantity of the product to order.",
        example: 2,
        minimum: 1,
    })
    @IsInt()
    @IsPositive()
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({
        description:
            "List of products and their quantities to include in the order.",
        type: [OrderItemDto],
        minItems: 1,
        example: [
            {
                productId: "cm123abc456def",
                quantity: 2,
            },
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({
        description: "The payment provider to use for the order.",
        enum: PaymentProvider,
        enumName: "PaymentProvider",
        example: PaymentProvider.STRIPE,
    })
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @ApiProperty({
        description: "The currency to use for the order.",
        example: "USD",
    })
    @IsString()
    currency: string;
}
