import { IsEmail, IsObject, IsString } from "class-validator";

export class SendEmailDto {
    @IsEmail()
    to: string;

    @IsString()
    subject: string;

    @IsString()
    template: string;

    @IsObject()
    context: Record<string, unknown>;
}
