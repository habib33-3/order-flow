import { Job } from "bullmq";
import { BaseProcessor } from "src/common/queue/base.processor.service";

import { PaymentService } from "../payment.service";
import { PAYMENT_JOB_NAMES } from "./payment-job.constants";

export class PaymentProcessor extends BaseProcessor {
    constructor(private readonly payment: PaymentService) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case PAYMENT_JOB_NAMES.EXPIRE_PAYMENT:
                await this.payment.expirePayment(
                    job.data.paymentId,
                    job.data.orderId
                );
                break;
        }
    }
}
