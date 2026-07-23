import { ApiProperty } from "@nestjs/swagger";

import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {
    @ApiProperty({
        example: "john.doe@example.com",
        description: "The user's email address",
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: "123456",
        description: "The user's password",
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}
