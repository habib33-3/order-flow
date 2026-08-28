import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";

import { env } from "src/common/env/env";

import { QueueService } from "./queue.service";

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                url: env.REDIS_URL,
            },
        }),
    ],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
