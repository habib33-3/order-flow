import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";

import { Queue } from "bullmq";

import { QUEUE_NAMES } from "../queue/queue.constants";
import { SendEmailDto } from "./dto/send-email.dto";

@Injectable()
export class EmailQueueService {
    constructor(
        @InjectQueue(QUEUE_NAMES.EMAIL)
        private readonly emailQueue: Queue
    ) {}

    async sendEmail(dto: SendEmailDto, jobId: string): Promise<void> {
        await this.emailQueue.add("send-email", dto, {
            jobId,
        });
    }
}
