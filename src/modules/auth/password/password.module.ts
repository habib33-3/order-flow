import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PasswordController } from "./password.controller";
import { PasswordService } from "./password.service";

@Module({
    controllers: [PasswordController],
    providers: [PasswordService, JwtService],
})
export class PasswordModule {}
