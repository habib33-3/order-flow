import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { CreateShippingAddressDto } from "./dto/create-shipping-address.dto";
import { ShippingAddressService } from "./shipping-address.service";

@Controller("shipping-address")
export class ShippingAddressController {
    constructor(
        private readonly shippingAddressService: ShippingAddressService
    ) {}

    @Post()
    @ApiOperation({
        summary: "Create shipping address",
        description:
            "Creates a new shipping address for the authenticated user.",
    })
    async createShippingAddress(
        @Body() payload: CreateShippingAddressDto,
        @CurrentUser("sub") userId: string
    ) {
        return this.shippingAddressService.createShippingAddress(
            payload,
            userId
        );
    }
}
