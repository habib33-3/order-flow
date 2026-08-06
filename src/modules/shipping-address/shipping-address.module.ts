import { Module } from "@nestjs/common";

import { ShippingAddressController } from "./shipping-address.controller";
import { ShippingAddressService } from "./shipping-address.service";

@Module({
    controllers: [ShippingAddressController],
    providers: [ShippingAddressService],
})
export class ShippingAddressModule {}
