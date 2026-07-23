import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { AdminGuard } from "src/common/guards/admin.guard";

import { CreateProductDto } from "./dto/create-product.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @AdminGuard()
    @Post()
    @ApiOperation({
        summary: "Create a new product",
        description:
            "Creates a new product with the provided name, description, price, stock, and status. A unique SKU is automatically generated for the product.",
    })
    async createProduct(@Body() payload: CreateProductDto) {
        return this.productsService.createProduct(payload);
    }
}
