import { Injectable } from "@nestjs/common";

import { EmailService } from "../../email.service";
import { SendOtpDto } from "./dto/send-otp.dto";

@Injectable()
export class AuthEmailService {
    constructor(private readonly mail: EmailService) {}

    async sentOtpEmail(payload: SendOtpDto) {
        await this.mail.sendEmail({
            to: payload.receiverEmail,
            subject: "Verify Your Email Address",
            template: "auth/verify-otp",
            context: {
                name: payload.receiverName,
                otp: payload.otp,
                expirationMinutes: payload.expirationMinutes,
            },
        });
    }

    async sentForgotPasswordOtpEmail(payload: SendOtpDto) {
        await this.mail.sendEmail({
            to: payload.receiverEmail,
            subject: "Reset Your Password",
            template: "auth/reset-password",
            context: {
                name: payload.receiverName,
                otp: payload.otp,
                expirationMinutes: payload.expirationMinutes,
            },
        });
    }
}
