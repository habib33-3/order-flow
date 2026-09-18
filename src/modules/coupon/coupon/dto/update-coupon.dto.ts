import { ApiPropertyOptional } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
    IsDate,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    Min,
} from "class-validator";
import { CouponStatus } from "src/generated/prisma/enums";

export class UpdateCouponDto {
    @ApiPropertyOptional({ example: "2026-09-17T00:00:00.000Z" })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startAt?: Date;

    @ApiPropertyOptional({ example: "2026-10-17T23:59:59.000Z" })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endAt?: Date;

    @ApiPropertyOptional({ example: 1000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minimumOrderAmount?: number;

    @ApiPropertyOptional({ example: 500 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maximumDiscountAmount?: number;

    @ApiPropertyOptional({ enum: CouponStatus })
    @IsOptional()
    @IsEnum(CouponStatus)
    status?: CouponStatus;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxLimit?: number;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxLimitPerUser?: number;
}
