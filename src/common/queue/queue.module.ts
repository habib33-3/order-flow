import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";

import { env } from "src/common/env/env";

import { BaseProcessor } from "./base.processor.service";
import { QueueService } from "./queue.service";

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                url: env.REDIS_URL,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
            },
        }),
    ],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
