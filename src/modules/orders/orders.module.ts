import { Module } from "@nestjs/common";

import { CartModule } from "../cart/cart.module";
import { ShippingAddressModule } from "../shipping-address/shipping-address.module";
import { CreateOrderService } from "./create-order.service";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
    imports: [ShippingAddressModule, CartModule],
    controllers: [OrdersController],
    providers: [OrdersService, CreateOrderService],
})
export class OrdersModule {}
