import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UploadedFiles,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import {
    UploadFileFields,
    UploadMultipleFiles,
    UploadSingleFile,
} from "src/common/decorators/upload.decorator";
import { AdminGuard } from "src/common/guards/admin.guard";
import { ProductStatus } from "src/generated/prisma/enums";

import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductImageDto } from "./dto/update-product-image.dto";
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
    @UploadFileFields(
        [
            { name: "thumbnail", maxCount: 1 },
            { name: "images", maxCount: 5 },
        ],
        "image"
    )
    async createProduct(
        @Body() payload: CreateProductDto,
        @UploadedFiles()
        files: {
            thumbnail?: Express.Multer.File[];
            images?: Express.Multer.File[];
        }
    ) {
        return this.productsService.createProduct(
            payload,
            files.thumbnail?.[0],
            files.images ?? []
        );
    }

    @AdminGuard()
    @Patch(":id")
    @ApiOperation({
        summary: "Partially update a product",
        description:
            "Updates one or more fields of an existing product. Only the fields provided in the request body will be updated.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Unique identifier of the product to update.",
    })
    async updateProduct(
        @Param("id") productId: string,
        @Body() payload: UpdateProductDto
    ) {
        return this.productsService.updateProduct(payload, productId);
    }

    @AdminGuard()
    @Delete(":id")
    @ApiOperation({
        summary: "Delete a product",
        description:
            "Deletes an existing product. The product will be permanently removed from the database.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Unique identifier of the product to delete.",
    })
    async deleteProduct(@Param("id") productId: string) {
        return this.productsService.deleteProduct(productId);
    }

    @Get()
    @ApiOperation({
        summary: "Get all products",
        description:
            "Retrieves a list of all products in the database, with optional filtering, sorting, and pagination.",
    })
    @ApiQuery({
        name: "search",
        type: String,
        required: false,
        description: "Search products by name or description.",
    })
    @ApiQuery({
        name: "cursorId",
        type: String,
        required: false,
        description:
            "The ID of the last product from the previous page. Use this value to fetch the next page.",
    })
    @ApiQuery({
        name: "limit",
        type: Number,
        required: false,
        description:
            "Number of products to return per page. Maximum allowed value is 20.",
        example: 10,
        default: 10,
        minimum: 1,
        maximum: 20,
    })
    @ApiQuery({
        name: "status",
        enum: ProductStatus,
        required: false,
        description: "Filter products by their current status.",
    })
    @ApiQuery({
        name: "sort",
        enum: ["asc", "desc"],
        required: false,
        description: "Sort direction for the selected field.",
        example: "desc",
        default: "desc",
    })
    @ApiQuery({
        name: "sortBy",
        enum: ["price", "stock", "name", "createdAt"],
        required: false,
        description: "The product field used to sort the results.",
        example: "createdAt",
        default: "createdAt",
    })
    async getAllProducts(
        @Query("search") search?: string,

        @Query("cursorId") cursorId?: string,

        @Query(
            "limit",
            new ParseIntPipe({
                optional: true,
            })
        )
        limit = 20,

        @Query(
            "status",
            new ParseEnumPipe(ProductStatus, {
                optional: true,
            })
        )
        status?: ProductStatus,

        @Query(
            "sort",
            new ParseEnumPipe(["asc", "desc"] as const, {
                optional: true,
            })
        )
        sort: "asc" | "desc" = "desc",

        @Query(
            "sortBy",
            new ParseEnumPipe(
                ["price", "stock", "name", "createdAt"] as const,
                {
                    optional: true,
                }
            )
        )
        sortBy: "price" | "stock" | "name" | "createdAt" = "createdAt"
    ) {
        return this.productsService.getAllProducts(
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

    @Get(":id")
    @ApiOperation({
        summary: "Get a single product",
        description: "Retrieves a single product by its unique identifier.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Unique identifier of the product to retrieve.",
    })
    async getProductById(@Param("id") productId: string) {
        return this.productsService.getProductById(productId);
    }

    @AdminGuard()
    @Patch(":id/thumbnail")
    @ApiOperation({
        summary: "Update the thumbnail of a product",
        description:
            "Updates the thumbnail of an existing product. The thumbnail will be replaced with the new one.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Unique identifier of the product to update.",
    })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                thumbnail: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @UploadSingleFile("thumbnail", "image")
    async changeProductThumbnail(
        @Param("id") productId: string,
        @UploadedFile() thumbnail: Express.Multer.File
    ) {
        return this.productsService.changeProductThumbnail(
            productId,
            thumbnail
        );
    }

    @AdminGuard()
    @Patch(":id/images")
    @ApiOperation({
        summary: "Update the images of a product",
        description:
            "Updates the images of an existing product. The images will be replaced with the new ones.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "Unique identifier of the product to update.",
    })
    @UploadMultipleFiles("images", 5, "image")
    async changeProductImages(
        @Param("id") productId: string,
        @UploadedFiles() images: Express.Multer.File[],
        @Body() payload: UpdateProductImageDto
    ) {
        return this.productsService.updateProductImages(
            productId,
            payload,
            images
        );
    }
}
