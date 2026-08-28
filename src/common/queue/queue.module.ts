// queue.module.ts
import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Global, Module } from "@nestjs/common";

import { ExpressAdapter } from "@bull-board/express";
import { BullBoardModule } from "@bull-board/nestjs";

import { env } from "../env/env";
import { QueueService } from "./queue.service";

@Global()
@Module({})
export class QueueModule {
    static forRoot(): DynamicModule {
        return {
            module: QueueModule,

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

                ...(env.SHOW_BULL_BOARD
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
                    : []),
            ],

            providers: [QueueService],
            exports: [QueueService],
        };
    }
}
