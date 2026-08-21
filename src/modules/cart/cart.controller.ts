import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from "@nestjs/common";
import { ApiOperation, ApiParam } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { CartService } from "./cart.service";
import { AddItemToCartDto } from "./dto/add-item-to-cart.dto";
import { ManageCartDto } from "./dto/manage-cart.dto";

@Controller("cart")
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Post("add-item")
    @ApiOperation({
        summary: "Add item to cart",
        description: "Adds a product to the authenticated user's cart.",
    })
    async addItemToCart(
        @CurrentUser("sub") userId: string,
        @Body() payload: AddItemToCartDto
    ) {
        return this.cartService.addItemToCart(userId, payload);
    }

    @Patch("manage")
    @ApiOperation({
        summary: "Manage cart item",
        description:
            "Updates the quantity of an existing cart item or removes the item from the authenticated user's cart.",
    })
    async manageCart(
        @CurrentUser("sub") userId: string,
        @Body() payload: ManageCartDto
    ) {
        return this.cartService.manageCart(userId, payload);
    }

    @Get()
    @ApiOperation({
        summary: "Get cart",
        description:
            "Returns the authenticated user's current cart and its items.",
    })
    async getMyCart(@CurrentUser("sub") userId: string) {
        return this.cartService.getMyCart(userId);
    }

    @Delete("items/:productId")
    @ApiOperation({
        summary: "Remove item from cart",
        description:
            "Removes a specific product from the authenticated user's cart.",
    })
    @ApiParam({
        name: "productId",
        description: "ID of the product to remove from the cart",
        required: true,
    })
    async removeItemFromCart(
        @CurrentUser("sub") userId: string,
        @Param("productId") productId: string
    ) {
        return this.cartService.removeItemFromCart(userId, productId);
    }

    @Delete()
    @ApiOperation({
        summary: "Clear cart",
        description: "Removes all items from the authenticated user's cart.",
    })
    async clearCart(@CurrentUser("sub") userId: string) {
        return this.cartService.clearCart(userId);
    }
}
