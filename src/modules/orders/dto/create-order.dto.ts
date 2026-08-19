import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";
import { PaymentProvider } from "src/generated/prisma/enums";

export class CreateOrderDto {
    @ApiProperty({
        description: "The ID of the shipping address to use for the order.",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @IsString()
    @IsNotEmpty()
    shippingAddressId: string;

    @ApiProperty({
        description: "The ID of the cart to convert into an order.",
        example: "550e8400-e29b-41d4-a716-446655440001",
    })
    @IsString()
    @IsNotEmpty()
    cartId: string;

    @ApiProperty({
        description: "The payment provider to use for the order.",
        enum: PaymentProvider,
        enumName: "PaymentProvider",
        example: PaymentProvider.STRIPE,
    })
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @ApiProperty({
        description: "The currency used for the order.",
        example: "USD",
        minLength: 3,
        maxLength: 3,
    })
    @IsString()
    @IsNotEmpty()
    currency: string;

    @ApiPropertyOptional({
        description: "Optional note or instruction for the order.",
        example: "Please deliver after 6 PM.",
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    orderNote?: string;
}
