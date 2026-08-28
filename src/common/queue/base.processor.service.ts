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
        this.logger.debug(
            `Job completed | queue=${job.queueName} job=${job.id} name=${job.name} attempts=${job.attemptsMade}`
        );
    }

    @OnWorkerEvent("failed")
    onFailed(job: Job, error: Error) {
        this.logger.error(
            `Job failed | queue=${job.queueName} job=${job.id} name=${job.name} attempts=${job.attemptsMade} error=${error.message}`,
            error.stack
        );
    }

    @OnWorkerEvent("active")
    onActive(job: Job) {
        this.logger.debug(
            `Job started | queue=${job.queueName} job=${job.id} name=${job.name} attempt=${job.attemptsMade + 1}`
        );
    }

    @OnWorkerEvent("stalled")
    onStalled(jobId: string) {
        this.logger.warn(`Job stalled | job=${jobId}`);
    }
}
