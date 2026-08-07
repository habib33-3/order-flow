import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    categoryCacheKeyWithId,
    categoryListCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { UploadFileService } from "src/common/upload-file/upload-file.service";
import { Category, Prisma } from "src/generated/prisma/client";

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

    async getCategories(search?: string) {
        const cacheKey = categoryListCacheKey(search);

        const cached = await this.redis.get<Category[]>(cacheKey);

        if (cached) {
            return cached;
        }

        const where: Prisma.CategoryWhereInput = {};

        if (search?.trim()) {
            where.name = {
                contains: search.trim(),
                mode: "insensitive",
            };
        }

        const categories = await this.prisma.category.findMany({
            where,
            orderBy: {
                name: "asc",
            },
        });

        await this.redis.set(cacheKey, categories);

        return categories;
    }

    async getCategoryById(id: string) {
        const cacheKey = categoryCacheKeyWithId(id);

        const cached = await this.redis.get<Category>(cacheKey);

        if (cached) {
            return cached;
        }

        const category = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException("Category not found");
        }

        await this.redis.set(cacheKey, category);

        return category;
    }
}
