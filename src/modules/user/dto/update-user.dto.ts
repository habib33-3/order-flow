import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";

export class UpdateUserProfileDto {
    @ApiPropertyOptional({
        example: "John Doe",
        description: "User's full name",
    })
    @IsOptional()
    @IsString()
    @Length(2, 100)
    name?: string;

    @ApiPropertyOptional({
        example: "+8801712345678",
        description: "User's phone number in E.164 format",
    })
    @IsOptional()
    @IsPhoneNumber()
    phone?: string;
}
