import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { Resend } from "resend";

import { env } from "../env/env";
import { SendEmailDto } from "./dto/send-email.dto";
import { TemplateRenderService } from "./template-render.service";

@Injectable()
export class EmailService {
    private readonly resend: Resend;

    constructor(private readonly templateRenderService: TemplateRenderService) {
        this.resend = new Resend(env.RESEND_API_KEY);
    }

    async sendEmail(dto: SendEmailDto): Promise<void> {
        const html = this.templateRenderService.renderTemplate(
            dto.template,
            dto.context
        );

        const { error } = await this.resend.emails.send({
            from: env.EMAIL_FROM_EMAIL!,
            to: dto.to,
            subject: dto.subject,
            html,
        });

        if (error) {
            throw new InternalServerErrorException(
                `Failed to send email: ${error.message}`
            );
        }
    }
}
