import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";

import { Queue } from "bullmq";
import { QUEUE_NAMES } from "src/common/queue/queue.constants";

import { PAYMENT_JOB_NAMES } from "./payment-job.constants";

@Injectable()
export class PaymentQueueService {
    constructor(
        @InjectQueue(QUEUE_NAMES.PAYMENT)
        private readonly paymentQueue: Queue
    ) {}

    async enqueuePaymentExpiration(paymentId: string, orderId: string) {
        const delay = 5 * 60 * 1000; // 5 minutes

        return this.paymentQueue.add(
            PAYMENT_JOB_NAMES.EXPIRE_PAYMENT,
            {
                paymentId,
                orderId,
            },
            {
                delay,
                jobId: `expire-payment:${paymentId}`,
                removeOnComplete: true,
            }
        );
    }
}
