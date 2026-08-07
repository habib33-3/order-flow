import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { Decimal } from "@prisma/client/runtime/client";
import { PrismaService } from "src/common/prisma/prisma.service";
import {
    productCacheKeyWithId,
    productListCacheKey,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { UploadFileService } from "src/common/upload-file/upload-file.service";
import { generateSku } from "src/common/utils/generate-sku";
import { Prisma, Product, ProductStatus } from "src/generated/prisma/client";

import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductImageDto } from "./dto/update-product-image.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly upload: UploadFileService,
        private readonly redis: RedisService
    ) {}

    private readonly MAX_IMAGES = 5;

    async createProduct(
        payload: CreateProductDto,
        thumbnail?: Express.Multer.File,
        images?: Express.Multer.File[]
    ) {
        const MAX_RETRIES = 3;

        if (!thumbnail || images?.length === 0) {
            throw new BadRequestException(
                "Thumbnail and at least one image is required"
            );
        }

        if ((images?.length ?? 0) > this.MAX_IMAGES) {
            throw new BadRequestException(
                `Max ${this.MAX_IMAGES} images are allowed`
            );
        }

        const thumbnailResult = await this.upload.uploadFile(
            thumbnail,
            "products"
        );

        const imageResults = await this.upload.uploadMultipleFiles(
            images!,
            "products"
        );

        try {
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    const product = await this.prisma.product.create({
                        data: {
                            name: payload.name,
                            description: payload.description,
                            price: new Decimal(payload.price).toDecimalPlaces(
                                2
                            ),
                            stock: payload.stock,
                            sku: generateSku(),
                            status: payload.status,
                            thumbnail: thumbnailResult.url,
                            images: imageResults.map((img) => img.url),
                        },
                    });

                    await Promise.all([
                        this.redis.set(
                            productCacheKeyWithId(product.id),
                            product
                        ),
                        this.redis.delete(productListCacheKey()),
                    ]);
                } catch (error) {
                    if (
                        error instanceof Prisma.PrismaClientKnownRequestError &&
                        error.code === "P2002"
                    ) {
                        if (attempt < MAX_RETRIES - 1) {
                            continue;
                        }

                        throw new ConflictException(
                            "Unable to generate a unique SKU."
                        );
                    }

                    throw error;
                }
            }
        } catch (error) {
            await Promise.allSettled([
                this.upload.deleteFile(thumbnailResult.url),
                this.upload.deleteMultipleFiles(
                    imageResults.map((img) => img.url)
                ),
            ]);

            throw error;
        }
    }

    async updateProduct(payload: UpdateProductDto, productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        const updateData: Prisma.ProductUpdateInput = {
            ...(payload.name !== undefined && {
                name: payload.name,
            }),
            ...(payload.description !== undefined && {
                description: payload.description,
            }),
            ...(payload.price !== undefined && {
                price: payload.price,
            }),
            ...(payload.stock !== undefined && {
                stock: payload.stock,
            }),
            ...(payload.status !== undefined && {
                status: payload.status,
            }),
        };

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: updateData,
        });

        await Promise.all([
            this.redis.set(productCacheKeyWithId(product.id), updatedProduct),
            this.redis.delete(productListCacheKey()),
        ]);

        return updatedProduct;
    }

    async deleteProduct(productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        await this.prisma.product.delete({
            where: { id: productId },
        });

        await Promise.all([
            this.redis.delete(productCacheKeyWithId(product.id)),
            this.redis.delete(productListCacheKey()),
        ]);

        return {
            message: "Product deleted successfully",
        };
    }

    async getAllProducts(
        search?: string,
        cursorId?: string,
        limit = 20,
        filter?: {
            status?: ProductStatus;
        },
        sort: "asc" | "desc" = "desc",
        sortBy: "price" | "stock" | "name" | "createdAt" = "createdAt"
    ) {
        limit = Math.min(Math.max(limit, 1), 50);

        const cacheKey = productListCacheKey(
            search,
            cursorId,
            limit,
            filter,
            sort,
            sortBy
        );

        const cached = await this.redis.get<{
            data: Product[];
            meta: {
                limit: number;
                hasNextPage: boolean;
                nextCursor: string | null;
            };
        }>(cacheKey);

        if (cached) {
            return cached;
        }

        const where: Prisma.ProductWhereInput = {};

        if (search?.trim()) {
            const searchTerm = search.trim();

            where.OR = [
                {
                    name: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
            ];
        }

        if (filter?.status) {
            where.status = filter.status;
        }

        const products = await this.prisma.product.findMany({
            where,
            take: limit + 1,

            ...(cursorId && {
                cursor: { id: cursorId },
                skip: 1,
            }),

            orderBy: [
                {
                    [sortBy]: sort,
                },
                {
                    id: sort,
                },
            ],
        });

        const hasNextPage = products.length > limit;

        if (hasNextPage) {
            products.pop();
        }

        const response = {
            data: products,
            meta: {
                limit,
                hasNextPage,
                nextCursor: hasNextPage
                    ? products[products.length - 1].id
                    : null,
            },
        };

        await this.redis.set(cacheKey, response);

        return response;
    }

    async getProductById(productId: string) {
        const cacheKey = productCacheKeyWithId(productId);

        const cached = await this.redis.get<Product>(cacheKey);

        if (cached) {
            return cached;
        }

        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        await this.redis.set(cacheKey, product);

        return product;
    }

    async changeProductThumbnail(
        productId: string,
        thumbnail: Express.Multer.File
    ) {
        if (!thumbnail) {
            throw new BadRequestException("Thumbnail is required");
        }

        const product = await this.getProductById(productId);

        const result = await this.upload.uploadFile(thumbnail, "products");

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: {
                thumbnail: result.url,
            },
        });

        await this.upload.deleteFile(product.thumbnail);

        await Promise.all([
            this.redis.set(productCacheKeyWithId(product.id), updatedProduct),
            this.redis.delete(productListCacheKey()),
        ]);

        return updatedProduct;
    }

    async updateProductImages(
        productId: string,
        payload: UpdateProductImageDto,
        images: Express.Multer.File[]
    ) {
        const product = await this.getProductById(productId);

        const removedImages = payload.removedImages ?? [];

        // Ensure every removed image belongs to this product
        const invalidImages = removedImages.filter(
            (url) => !product.images.includes(url)
        );

        if (invalidImages.length > 0) {
            throw new BadRequestException("Some images are invalid.");
        }

        const remainingImages = product.images.filter(
            (url) => !removedImages.includes(url)
        );

        const totalImages = remainingImages.length + images.length;

        if (totalImages === 0) {
            throw new BadRequestException("At least one image is required.");
        }

        if (totalImages > this.MAX_IMAGES) {
            throw new BadRequestException(
                `Maximum ${this.MAX_IMAGES} images are allowed.`
            );
        }

        const uploadedImages =
            images.length > 0
                ? await this.upload.uploadMultipleFiles(images, "products")
                : [];

        try {
            const updatedProduct = await this.prisma.product.update({
                where: { id: productId },
                data: {
                    images: [
                        ...remainingImages,
                        ...uploadedImages.map((img) => img.url),
                    ],
                },
            });

            // Delete old images only after DB update succeeds
            if (removedImages.length > 0) {
                await this.upload.deleteMultipleFiles(removedImages);
            }

            await Promise.all([
                this.redis.set(
                    productCacheKeyWithId(product.id),
                    updatedProduct
                ),
                this.redis.delete(productListCacheKey()),
            ]);

            return updatedProduct;
        } catch (error) {
            // Rollback newly uploaded images
            if (uploadedImages.length > 0) {
                await this.upload.deleteMultipleFiles(
                    uploadedImages.map((img) => img.url)
                );
            }

            throw error;
        }
    }
}
