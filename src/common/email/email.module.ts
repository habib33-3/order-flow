import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";

import { QUEUE_NAMES } from "../queue/queue.constants";
import { QueueModule } from "../queue/queue.module";
import { EmailProcessor } from "./email.processor";
import { EmailQueueService } from "./email.queue.service";
import { EmailService } from "./email.service";
import { AuthEmailService } from "./handler/auth/auth-email.service";
import { TemplateRenderService } from "./template-render.service";

@Global()
@Module({
    imports: [
        BullModule.registerQueue({
            name: QUEUE_NAMES.EMAIL,
        }),
        QueueModule,
    ],
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
