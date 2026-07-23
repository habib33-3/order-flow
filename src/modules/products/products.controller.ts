import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiParam } from "@nestjs/swagger";

import { AdminGuard } from "src/common/guards/admin.guard";

import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
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

    @AdminGuard()
    @Patch(":productId")
    @ApiOperation({
        summary: "Partially update a product",
        description:
            "Updates one or more fields of an existing product. Only the fields provided in the request body will be updated.",
    })
    @ApiParam({
        name: "productId",
        type: String,
        description: "Unique identifier of the product to update.",
        example: "clx1234567890",
    })
    async updateProduct(
        @Param("productId") productId: string,
        @Body() payload: UpdateProductDto
    ) {
        return this.productsService.updateProduct(payload, productId);
    }

    @AdminGuard()
    @Delete(":productId")
    @ApiOperation({
        summary: "Delete a product",
        description:
            "Deletes an existing product. The product will be permanently removed from the database.",
    })
    @ApiParam({
        name: "productId",
        type: String,
        description: "Unique identifier of the product to delete.",
        example: "clx1234567890",
    })
    async deleteProduct(@Param("productId") productId: string) {
        return this.productsService.deleteProduct(productId);
    }
}
