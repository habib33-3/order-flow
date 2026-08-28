// queue-registration.module.ts
import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module } from "@nestjs/common";

import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";

import { env } from "../env/env";
import { QueueName } from "./queue.constants";

@Module({})
export class QueueRegistrationModule {
    static register(name: QueueName): DynamicModule {
        return {
            module: QueueRegistrationModule,

            imports: [
                BullModule.registerQueue({
                    name,
                }),

                ...(env.SHOW_BULL_BOARD
                    ? [
                          BullBoardModule.forFeature({
                              name,
                              adapter: BullMQAdapter,
                          }),
                      ]
                    : []),
            ],

            exports: [BullModule],
        };
    }
}
