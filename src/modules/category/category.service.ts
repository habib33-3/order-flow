import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    categoryCacheKeyWithId,
    categoryListCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { UploadFileService } from "src/common/upload-file/upload-file.service";

import { CreateCategoryDto } from "./dto/create-category.dto";

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly upload: UploadFileService,
        private readonly redis: RedisService
    ) {}

    async createCategory(
        payload: CreateCategoryDto,
        logo: Express.Multer.File
    ) {
        if (!logo) {
            throw new BadRequestException("Logo is required");
        }

        const result = await this.upload.uploadFile(logo, "categories");

        const category = await this.prisma.category.create({
            data: {
                name: payload.name,
                logo: result.url,
            },
        });

        await Promise.all([
            this.redis.set(categoryCacheKeyWithId(category.id), category),
            this.redis.delete(categoryListCacheKey()),
        ]);

        return category;
    }
}
