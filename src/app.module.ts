import { createHash } from "node:crypto";

import { InternalServerErrorException, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { createObserveModule } from "@nestjs/observe";
import {
    normalizeIp,
    ThrottlerGuard,
    ThrottlerModule,
    type ThrottlerModuleOptions,
} from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EmailModule } from "./common/email/email.module";
import { env, validateEnv } from "./common/env/env";
import { LlmModule } from "./common/llm/llm.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { QueueModule } from "./common/queue/queue.module";
import {
    DEFAULT_RATE_LIMIT,
    RATE_LIMIT_ACCOUNT_SCOPE_KEY,
} from "./common/rate-limit/rate-limit.config";
import { RedisThrottlerStorage } from "./common/rate-limit/redis-throttler.storage";
import { RedisModule } from "./common/redis/redis.module";
import { RedisService } from "./common/redis/redis.service";
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
import { ProductReviewSummaryModule } from "./modules/product-review-summary/product-review-summary.module";
import { ProductsModule } from "./modules/products/products.module";
import { PlatformReviewAnalyticsModule } from "./modules/review/platform-review/platform-review-analytics/platform-review-analytics.module";
import { PlatformReviewModule } from "./modules/review/platform-review/platform-review/platform-review.module";
import { ProductReviewAnalyticsModule } from "./modules/review/product-review/product-review-analytics/product-review-analytics.module";
import { ProductReviewModule } from "./modules/review/product-review/product-review/product-review.module";
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
        ThrottlerModule.forRootAsync({
            imports: [RedisModule],
            inject: [RedisService],
            useFactory: (redis: RedisService): ThrottlerModuleOptions => ({
                throttlers: [
                    { name: "default", ...DEFAULT_RATE_LIMIT },
                    {
                        name: "account",
                        ...DEFAULT_RATE_LIMIT,
                        skipIf: (context) =>
                            !Reflect.getMetadata(
                                RATE_LIMIT_ACCOUNT_SCOPE_KEY,
                                context.getHandler()
                            ),
                        getTracker: (request: Record<string, unknown>) => {
                            const userId = getRequestUserId(request);
                            if (userId !== undefined) {
                                return `user:${userId}`;
                            }

                            const email = getRequestEmail(request);
                            if (email !== undefined) {
                                return `account:${createHash("sha256")
                                    .update(email)
                                    .digest("hex")}`;
                            }

                            return getRequestIpTracker(request);
                        },
                    },
                ],
                storage: new RedisThrottlerStorage(redis),
                getTracker: getRequestTracker,
            }),
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
        ProductReviewModule,
        ProductReviewAnalyticsModule,
        LlmModule,
        ProductReviewSummaryModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: AccessTokenGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}

function getRequestTracker(request: Record<string, unknown>): string {
    const userId = getRequestUserId(request);

    return userId === undefined
        ? getRequestIpTracker(request)
        : `user:${userId}`;
}

function getRequestUserId(
    request: Record<string, unknown>
): string | undefined {
    const requestUser = request.user;

    if (
        typeof requestUser === "object" &&
        requestUser !== null &&
        "sub" in requestUser &&
        typeof requestUser.sub === "string"
    ) {
        return requestUser.sub;
    }

    return undefined;
}

function getRequestEmail(request: Record<string, unknown>): string | undefined {
    const body = request.body;
    const email =
        typeof body === "object" && body !== null && "email" in body
            ? body.email
            : undefined;

    return typeof email === "string" && email.trim().length > 0
        ? email.trim().toLowerCase()
        : undefined;
}

function getRequestIpTracker(request: Record<string, unknown>): string {
    const socket = request.socket;
    const remoteAddress =
        typeof socket === "object" &&
        socket !== null &&
        "remoteAddress" in socket
            ? socket.remoteAddress
            : undefined;
    const ip = request.ip ?? remoteAddress;

    if (typeof ip !== "string" || ip.length === 0) {
        throw new InternalServerErrorException(
            "Unable to determine the client IP for rate limiting"
        );
    }

    return `ip:${normalizeIp(ip)}`;
}
