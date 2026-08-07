import { Module } from "@nestjs/common";

import { CategoryService } from "../category/category.service";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
    controllers: [ProductsController],
    providers: [ProductsService, CategoryService],
})
export class ProductsModule {}
