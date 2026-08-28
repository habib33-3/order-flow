import { Processor } from "@nestjs/bullmq";

import { Job } from "bullmq";

import { BaseProcessor } from "../queue/base.processor.service";
import { QUEUE_NAMES } from "../queue/queue.constants";
import { SendEmailDto } from "./dto/send-email.dto";
import { EmailService } from "./email.service";

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends BaseProcessor {
    constructor(private readonly emailService: EmailService) {
        super();
    }

    async process(job: Job<SendEmailDto>) {
        await this.emailService.sendEmail(job.data);
    }
}
