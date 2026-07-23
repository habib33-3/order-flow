import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @ApiOperation({
        summary: "Create an order",
        description: "Create an order",
    })
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @CurrentUser("sub") userId: string
    ) {
        return this.ordersService.createOrder(userId, createOrderDto);
    }
}
