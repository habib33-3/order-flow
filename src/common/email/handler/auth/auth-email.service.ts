import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { EmailQueueService } from "../../email.queue.service";
import { SendOtpDto } from "./dto/send-otp.dto";

@Injectable()
export class AuthEmailService {
    constructor(private readonly mailQueue: EmailQueueService) {}

    async sentOtpEmail(payload: SendOtpDto) {
        const jobId = `otp-email${randomUUID()}`;

        await this.mailQueue.sendEmail(
            {
                to: payload.receiverEmail,
                subject: "Verify Your Email Address",
                template: "auth/verify-otp",
                context: {
                    name: payload.receiverName,
                    otp: payload.otp,
                    expirationMinutes: payload.expirationMinutes,
                },
            },
            jobId
        );
    }

    async sentForgotPasswordOtpEmail(payload: SendOtpDto) {
        const jobId = `forgot-otp-email${randomUUID()}`;

        await this.mailQueue.sendEmail(
            {
                to: payload.receiverEmail,
                subject: "Reset Your Password",
                template: "auth/reset-password",
                context: {
                    name: payload.receiverName,
                    otp: payload.otp,
                    expirationMinutes: payload.expirationMinutes,
                },
            },
            jobId
        );
    }
}
