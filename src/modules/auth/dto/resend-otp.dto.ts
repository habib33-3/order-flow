import { ApiProperty } from "@nestjs/swagger";

import { IsEmail } from "class-validator";

export class ResendOtpDto {
    @IsEmail()
    @ApiProperty({
        description: "The email address of the user requesting OTP resend",
        example: "user@example.com",
    })
    email: string;
}
