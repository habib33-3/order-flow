import { ApiProperty } from "@nestjs/swagger";

import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { PaymentProvider } from "src/generated/prisma/enums";

export enum Currency {
    USD = "USD",
    BDT = "BDT",
}

export class CreateOrderDto {
    @ApiProperty({
        description: "The ID of the shipping address to use for the order.",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @IsString()
    @IsNotEmpty()
    shippingAddressId: string;

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
        enum: Currency,
        example: Currency.USD,
    })
    @IsEnum(Currency)
    currency: Currency;

    @IsString()
    @MaxLength(500)
    orderNote?: string;
}
