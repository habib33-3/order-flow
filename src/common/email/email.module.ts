import { Global, Module } from "@nestjs/common";

import { EmailService } from "./email.service";
import { AuthEmailService } from "./handler/auth/auth-email.service";
import { TemplateRenderService } from "./template-render.service";

@Global()
@Module({
    providers: [EmailService, TemplateRenderService, AuthEmailService],
    exports: [AuthEmailService],
})
export class EmailModule {}
