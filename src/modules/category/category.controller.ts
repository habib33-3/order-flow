import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

import { UploadSingleFile } from "src/common/decorators/upload.decorator";
import { AdminGuard } from "src/common/guards/admin.guard";

import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Controller("category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @AdminGuard()
    @Post()
    @ApiOperation({
        summary: "Create category",
        description: "Create category",
    })
    @UploadSingleFile("image", "image")
    async createCategory(
        @Body() payload: CreateCategoryDto,
        @UploadedFile() logo: Express.Multer.File
    ) {
        return this.categoryService.createCategory(payload, logo);
    }

    @Get()
    @ApiOperation({
        summary: "Get all categories",
        description:
            "Retrieves a list of product categories. Optionally filter the results by category name using the search query parameter.",
    })
    @ApiQuery({
        name: "search",
        required: false,
        type: String,
        description: "Search categories by name (case-insensitive).",
        example: "electronics",
    })
    async getCategories(@Query("search") search?: string) {
        return this.categoryService.getCategories(search);
    }

    @Get(":id")
    @ApiOperation({
        summary: "Get category by id",
        description: "Retrieves a specific category by its ID.",
    })
    @ApiParam({
        name: "id",
        type: String,
        description: "The ID of the category to retrieve.",
    })
    async getCategoryById(@Param("id") id: string) {
        return this.categoryService.getCategoryById(id);
    }

    @Patch(":id")
    @ApiOperation({
        summary: "Update a category",
        description:
            "Updates an existing category's description and/or logo. The category name cannot be modified.",
    })
    @UploadSingleFile("image", "image")
    async updateCategory(
        @Param("id") id: string,
        @Body() payload: CreateCategoryDto,
        @UploadedFile() logo?: Express.Multer.File
    ) {
        return this.categoryService.updateCategory(id, payload, logo);
    }
}
