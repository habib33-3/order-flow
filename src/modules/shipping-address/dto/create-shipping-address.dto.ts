import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { IsOptional, IsPostalCode, IsString, MaxLength } from "class-validator";

export class CreateShippingAddressDto {
    @ApiProperty({
        example: "123 Main Street, Apartment 4B",
        description: "Street address",
    })
    @IsString()
    @MaxLength(255)
    address: string;

    @ApiProperty({
        example: "Dhaka",
        description: "City",
    })
    @IsString()
    @MaxLength(100)
    city: string;

    @ApiPropertyOptional({
        example: "Dhaka Division",
        description: "State or province",
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @ApiProperty({
        example: "Bangladesh",
        description: "Country",
    })
    @IsString()
    @MaxLength(100)
    country: string;

    @ApiProperty({
        example: "1207",
        description: "Postal or ZIP code",
    })
    @IsPostalCode("any")
    postalCode: string;
}
