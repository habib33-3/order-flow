import {
    Body,
    Controller,
    Get,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { AdminGuard } from "src/common/guards/admin.guard";
import { OrderStatus } from "src/generated/prisma/enums";
import { type JwtPayload } from "src/types/types";

import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @ApiOperation({
        summary: "Create an order",
        description: "Create a new order for the authenticated user.",
    })
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @CurrentUser("sub") userId: string
    ) {
        return this.ordersService.createOrder(userId, createOrderDto);
    }

    @AdminGuard()
    @Get()
    @ApiOperation({
        summary: "Get all orders",
        description:
            "Retrieve all orders with optional search, cursor-based pagination, status filtering, and sorting. This endpoint is restricted to administrators.",
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search orders by customer name or email.",
    })
    @ApiQuery({
        name: "cursorId",
        required: false,
        type: String,
        description: "ID of the last order from the previous page.",
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        description: "Number of orders to return.",
        example: 10,
    })
    @ApiQuery({
        name: "status",
        required: false,
        enum: OrderStatus,
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        example: "desc",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "total"],
        example: "createdAt",
    })
    async getAllOrders(
        @Query("search") search?: string,

        @Query("cursorId") cursorId?: string,

        @Query(
            "limit",
            new ParseIntPipe({
                optional: true,
            })
        )
        limit?: number,

        @Query(
            "status",
            new ParseEnumPipe(OrderStatus, {
                optional: true,
            })
        )
        status?: OrderStatus,

        @Query(
            "sort",
            new ParseEnumPipe(["asc", "desc"], {
                optional: true,
            })
        )
        sort: "asc" | "desc" = "desc",

        @Query(
            "sortBy",
            new ParseEnumPipe(["createdAt", "total"], {
                optional: true,
            })
        )
        sortBy: "createdAt" | "total" = "createdAt"
    ) {
        return this.ordersService.getAllOrders(
            search,
            cursorId,
            limit,
            {
                status,
            },
            sort,
            sortBy
        );
    }

    @Get("me")
    @ApiOperation({
        summary: "Get my orders",
        description:
            "Retrieve orders created by the authenticated user with optional search, cursor-based pagination, status filtering, and sorting.",
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search orders by customer name or email.",
    })
    @ApiQuery({
        name: "cursorId",
        required: false,
        type: String,
        description: "ID of the last order from the previous page.",
    })
    @ApiQuery({
        name: "limit",
        required: false,
        type: Number,
        description: "Number of orders to return.",
        example: 10,
    })
    @ApiQuery({
        name: "status",
        required: false,
        enum: OrderStatus,
    })
    @ApiQuery({
        name: "sort",
        required: false,
        enum: ["asc", "desc"],
        example: "desc",
    })
    @ApiQuery({
        name: "sortBy",
        required: false,
        enum: ["createdAt", "total"],
        example: "createdAt",
    })
    async getMyOrders(
        @CurrentUser("sub") userId: string,
        @Query("search") search?: string,

        @Query("cursorId") cursorId?: string,

        @Query(
            "limit",
            new ParseIntPipe({
                optional: true,
            })
        )
        limit?: number,

        @Query(
            "status",
            new ParseEnumPipe(OrderStatus, {
                optional: true,
            })
        )
        status?: OrderStatus,

        @Query(
            "sort",
            new ParseEnumPipe(["asc", "desc"], {
                optional: true,
            })
        )
        sort: "asc" | "desc" = "desc",

        @Query(
            "sortBy",
            new ParseEnumPipe(["createdAt", "total"], {
                optional: true,
            })
        )
        sortBy: "createdAt" | "total" = "createdAt"
    ) {
        return this.ordersService.getMyOrders(
            userId,
            search,
            cursorId,
            limit,
            { status },
            sort,
            sortBy
        );
    }

    @Patch(":id/cancel")
    @ApiOperation({
        summary: "Cancel an order",
        description: "Cancel an order by its ID.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "The ID of the order to cancel.",
    })
    async cancelOrder(
        @Param("id") id: string,
        @CurrentUser("sub") userId: string
    ) {
        return this.ordersService.cancelOrder(userId, id);
    }

    @Get(":id")
    @ApiOperation({
        summary: "Get an order by ID",
        description:
            "Retrieve an order by its ID. Accessible to the order owner or an admin.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "The ID of the order to retrieve.",
    })
    async getOrder(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
        return this.ordersService.getOrderById(id, user);
    }
}
