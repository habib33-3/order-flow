import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
    IsDate,
    IsEnum,
    IsInt,
    IsNumberString,
    IsOptional,
    Min,
} from "class-validator";
import { CouponType } from "src/generated/prisma/enums";

export class CreateCouponDto {
    @ApiProperty({
        description:
            "Determines whether the coupon provides a percentage discount or a fixed monetary discount.",
        enum: CouponType,
        example: CouponType.PERCENTAGE,
    })
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty({
        description:
            "Discount value. For PERCENTAGE, this is the discount percentage. For FIXED, this is the fixed monetary discount amount.",
        example: "20.00",
    })
    @IsNumberString()
    discount: string;

    @ApiProperty({
        description: "Date and time when the coupon becomes valid.",
        example: "2026-09-01T00:00:00.000Z",
    })
    @Type(() => Date)
    @IsDate()
    startAt: Date;

    @ApiProperty({
        description: "Date and time when the coupon expires.",
        example: "2026-09-30T23:59:59.999Z",
    })
    @Type(() => Date)
    @IsDate()
    endAt: Date;

    @ApiPropertyOptional({
        description:
            "Minimum monetary order value required to apply the coupon.",
        example: "50.00",
    })
    @IsOptional()
    @IsNumberString()
    minimumOrderAmount?: string;

    @ApiPropertyOptional({
        description: "Maximum monetary discount amount for percentage coupons.",
        example: "100.00",
    })
    @IsOptional()
    @IsNumberString()
    maximumDiscountAmount?: string;

    @ApiProperty({
        description:
            "Maximum number of times the coupon can be redeemed globally.",
        example: 100,
        default: 1,
    })
    @IsInt()
    @Min(1)
    maxLimit = 1;

    @ApiProperty({
        description:
            "Maximum number of times a single user can redeem the coupon.",
        example: 2,
        default: 1,
    })
    @IsInt()
    @Min(1)
    maxLimitPerUser = 1;
}
