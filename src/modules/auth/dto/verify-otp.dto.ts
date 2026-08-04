import { ApiProperty } from "@nestjs/swagger";

import { IsEmail, IsNotEmpty, Matches } from "class-validator";

export class VerifyOtpEmailDto {
    @ApiProperty({
        example: "user@example.com",
        description: "The email address associated with the OTP",
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: "1234",
        description: "A 4-digit OTP sent to the user's email",
    })
    @IsNotEmpty()
    @Matches(/^\d{4}$/, {
        message: "OTP must be exactly 4 digits",
    })
    otp: string;
}
