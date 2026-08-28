import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";

import { ExpressAdapter } from "@bull-board/express";
import { BullBoardModule } from "@bull-board/nestjs";
import { env } from "src/common/env/env";

import { QueueService } from "./queue.service";

const bullBoardImports = env.SHOW_BULL_BOARD
    ? [
          BullBoardModule.forRoot({
              route: "/queues",
              adapter: ExpressAdapter,
              boardOptions: {
                  uiConfig: {
                      boardTitle: `${env.APP_NAME} Queues`,
                      hasHistoryUsage: true,
                  },
              },
          }),
      ]
    : [];

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                url: env.REDIS_URL,
            },
            defaultJobOptions: {
                removeOnComplete: {
                    age: 60 * 60,
                    count: 1000,
                },
                removeOnFail: {
                    age: 60 * 60 * 24,
                    count: 1000,
                },
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
            },
        }),

        ...bullBoardImports,
    ],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
