import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { validateEnv } from "./common/env/env";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtGuard } from "./modules/auth/guards/jwt.guard";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { ProductsModule } from "./modules/products/products.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
        RedisModule,
        AuthModule,
        ProductsModule,
        OrdersModule,
        PaymentModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule {}
