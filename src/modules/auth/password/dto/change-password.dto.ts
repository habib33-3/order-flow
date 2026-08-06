import { ApiProperty } from "@nestjs/swagger";

import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({
        example: "CurrentPassword123!",
        description: "The user's current password.",
    })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({
        example: "NewSecurePassword123!",
        description: "The new password.",
        minLength: 6,
        maxLength: 128,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(128)
    newPassword: string;
}
