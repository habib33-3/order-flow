import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EmailModule } from "./common/email/email.module";
import { validateEnv } from "./common/env/env";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { CronJobModule } from "./jobs/cron-job.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AccessTokenGuard } from "./modules/auth/guards/access-token.guard";
import { PasswordModule } from "./modules/auth/password/password.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { ProductsModule } from "./modules/products/products.module";
import { UserModule } from "./modules/user/user.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
            // envFilePath: ".env.prod",
        }),
        PrismaModule,
        RedisModule,
        AuthModule,
        ProductsModule,
        OrdersModule,
        PaymentModule,
        CronJobModule,
        EmailModule,
        UserModule,
        PasswordModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: AccessTokenGuard,
        },
    ],
})
export class AppModule {}
