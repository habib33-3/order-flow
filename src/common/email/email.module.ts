import { Global, Module } from "@nestjs/common";

import { QueueRegistrationModule } from "../queue/queue-registration.module";
import { QUEUE_NAMES } from "../queue/queue.constants";
import { EmailProcessor } from "./email.processor";
import { EmailQueueService } from "./email.queue.service";
import { EmailService } from "./email.service";
import { AuthEmailService } from "./handler/auth/auth-email.service";
import { TemplateRenderService } from "./template-render.service";

@Global()
@Module({
    imports: [QueueRegistrationModule.register(QUEUE_NAMES.EMAIL)],
    providers: [
        EmailService,
        TemplateRenderService,
        AuthEmailService,
        EmailProcessor,
        EmailQueueService,
    ],
    exports: [AuthEmailService],
})
export class EmailModule {}
