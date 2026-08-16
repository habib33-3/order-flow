import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { CartService } from "./cart.service";
import { AddItemToCartDto } from "./dto/add-item-to-cart.dto";

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
}
