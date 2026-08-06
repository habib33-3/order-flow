import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import {
    IsEmail,
    IsJWT,
    IsString,
    Length,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator";

export class ForgotPasswordDto {
    @ApiProperty({
        example: "user@example.com",
        description: "The email address associated with the account.",
    })
    @IsEmail({}, { message: "Please provide a valid email address." })
    email: string;
}

export class VerifyForgotPasswordOtpDto {
    @ApiProperty({
        example: "123456",
        description: "The 6-digit OTP sent to the user's email address.",
    })
    @IsString()
    @Length(6, 6, {
        message: "OTP must be exactly 6 digits.",
    })
    @Matches(/^\d{6}$/, {
        message: "OTP must be a 6-digit number.",
    })
    otp: string;

    @ApiProperty({
        example: "user@example.com",
        description: "The email address associated with the OTP.",
    })
    @IsEmail(
        {},
        {
            message: "Please provide a valid email address.",
        }
    )
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        description: "Password reset token received after OTP verification.",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    })
    @IsJWT({
        message: "Invalid password reset token.",
    })
    token: string;

    @ApiProperty({
        description: "The new password for the account.",
        example: "SecurePassword123!",
        minLength: 8,
        maxLength: 128,
    })
    @Transform(({ value }) => value.trim())
    @IsString()
    @MinLength(8, {
        message: "Password must be at least 8 characters long.",
    })
    @MaxLength(128, {
        message: "Password must not exceed 128 characters.",
    })
    newPassword: string;
}
