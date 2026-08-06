import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

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

    @Get()
    @ApiOperation({
        summary: "Get my shipping addresses",
        description:
            "Returns the authenticated user's shipping addresses with optional search.",
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search by address, city, state, country, or postal code.",
    })
    async getMyAddresses(
        @CurrentUser("sub") userId: string,
        @Query("search") search?: string
    ) {
        return this.shippingAddressService.getMyShippingAddresses(
            userId,
            search
        );
    }

    @Get(":id")
    @ApiOperation({
        summary: "Get shipping address by ID",
        description:
            "Returns the shipping address with the specified ID for the authenticated user.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Shipping address ID.",
    })
    async getShippingAddressById(
        @Param("id") id: string,
        @CurrentUser("sub") userId: string
    ) {
        return this.shippingAddressService.getShippingAddressById(id, userId);
    }
}
