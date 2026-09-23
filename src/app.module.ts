import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { createObserveModule } from "@nestjs/observe";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EmailModule } from "./common/email/email.module";
import { env, validateEnv } from "./common/env/env";
import { PrismaModule } from "./common/prisma/prisma.module";
import { QueueModule } from "./common/queue/queue.module";
import { RedisModule } from "./common/redis/redis.module";
import { UploadFileModule } from "./common/upload-file/upload-file.module";
import { CronJobModule } from "./jobs/cron-job.module";
import { AuthModule } from "./modules/auth/auth/auth.module";
import { AccessTokenGuard } from "./modules/auth/auth/guards/access-token.guard";
import { PasswordModule } from "./modules/auth/password/password.module";
import { CartModule } from "./modules/cart/cart.module";
import { CategoryModule } from "./modules/category/category.module";
import { CouponAnalyticsModule } from "./modules/coupon/coupon-analytics/coupon-analytics.module";
import { CouponModule } from "./modules/coupon/coupon/coupon.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { ProductsModule } from "./modules/products/products.module";
import { PlatformReviewAnalyticsModule } from "./modules/review/platform-review/platform-review-analytics/platform-review-analytics.module";
import { PlatformReviewModule } from "./modules/review/platform-review/platform-review/platform-review.module";
import { ShippingAddressModule } from "./modules/shipping-address/shipping-address.module";
import { UserModule } from "./modules/user/user.module";

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
    imports: [
        ObserveModule.forRoot({
            appKey: env.OBSERVE_APP_KEY,
            appSecret: env.OBSERVE_APP_SECRET,
            serviceId: "order-flow",
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
            // envFilePath: ".env.prod",
        }),
        PrismaModule,
        RedisModule,
        QueueModule.forRoot(),
        AuthModule,
        ProductsModule,
        OrdersModule,
        PaymentModule,
        CronJobModule,
        EmailModule,
        UserModule,
        PasswordModule,
        ShippingAddressModule,
        UploadFileModule,
        CategoryModule,
        CartModule,
        CouponModule,
        CouponAnalyticsModule,
        PlatformReviewModule,
        PlatformReviewAnalyticsModule,
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
