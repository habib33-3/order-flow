import { Body, Controller, Delete, Get, Patch, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { CartService } from "./cart.service";
import { AddItemToCartDto } from "./dto/add-item-to-cart.dto";
import { ManageCartDto } from "./dto/manage-cart.dto";

@Controller("cart")
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Post("add-item")
    @ApiOperation({
        summary: "Add an item to the cart",
        description: "Add an item to the cart",
    })
    async addItemToCart(
        @CurrentUser("sub") userId: string,
        @Body() payload: AddItemToCartDto
    ) {
        return this.cartService.addItemToCart(userId, payload);
    }

    @Patch("manage")
    @ApiOperation({
        summary: "Manage the cart",
        description: "Manage the cart",
    })
    async manageCart(
        @CurrentUser("sub") userId: string,
        @Body() payload: ManageCartDto
    ) {
        return this.cartService.manageCart(userId, payload);
    }

    @Get()
    @ApiOperation({
        summary: "Get my cart",
        description: "Get my cart",
    })
    async getMyCart(@CurrentUser("sub") userId: string) {
        return this.cartService.getMyCart(userId);
    }

    @Delete()
    @ApiOperation({
        summary: "Clear the cart",
        description: "Clear the cart",
    })
    async clearCart(@CurrentUser("sub") userId: string) {
        return this.cartService.clearCart(userId);
    }
}
