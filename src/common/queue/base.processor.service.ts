import { OnWorkerEvent, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";

import { Job } from "bullmq";

export abstract class BaseProcessor extends WorkerHost {
    protected readonly logger: Logger;

    constructor() {
        super();
        this.logger = new Logger(BaseProcessor.name);
    }

    @OnWorkerEvent("completed")
    onCompleted(job: Job) {
        this.logger.debug(`Job ${job.name} completed`);
    }

    @OnWorkerEvent("failed")
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.name} failed`, error.stack);
    }

    @OnWorkerEvent("active")
    onActive(job: Job) {
        this.logger.log(`Job ${job.name} started`);
    }

    @OnWorkerEvent("stalled")
    onStalled(jobId: string) {
        this.logger.warn(`Job ${jobId} stalled`);
    }
}
