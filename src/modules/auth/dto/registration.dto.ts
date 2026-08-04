import { ApiProperty } from "@nestjs/swagger";

import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

export class RegisterUserDto {
    @ApiProperty({
        example: "John Doe",
        description: "The user's full name",
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    name: string;

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
        minLength: 6,
        maxLength: 64,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(64)
    password: string;
}
