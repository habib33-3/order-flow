import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";

import { ExpressAdapter } from "@bull-board/express";
import { BullBoardModule } from "@bull-board/nestjs";
import { env } from "src/common/env/env";

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
        BullBoardModule.forRoot({
            route: "/queues",
            adapter: ExpressAdapter,
        }),
    ],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
