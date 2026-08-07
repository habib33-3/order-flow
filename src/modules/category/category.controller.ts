import { Body, Controller, Post, UploadedFile } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { UploadSingleFile } from "src/common/decorators/upload.decorator";

import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Controller("category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

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
}
