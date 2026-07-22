import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { validateEnv } from "./common/env/env";
import { RedisModule } from "./common/redis/redis.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
        RedisModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
