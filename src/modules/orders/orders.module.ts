import { Module } from "@nestjs/common";

import { CartModule } from "../cart/cart.module";
import { CouponAnalyticsModule } from "../coupon/coupon-analytics/coupon-analytics.module";
import { CouponModule } from "../coupon/coupon/coupon.module";
import { ShippingAddressModule } from "../shipping-address/shipping-address.module";
import { CreateOrderService } from "./create-order.service";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
    imports: [
        ShippingAddressModule,
        CartModule,
        CouponModule,
        CouponAnalyticsModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService, CreateOrderService],
})
export class OrdersModule {}
