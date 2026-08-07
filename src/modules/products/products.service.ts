import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { Decimal } from "@prisma/client/runtime/client";
import { PrismaService } from "src/common/prisma/prisma.service";
import { UploadFileService } from "src/common/upload-file/upload-file.service";
import { generateSku } from "src/common/utils/generate-sku";
import { Prisma, ProductStatus } from "src/generated/prisma/client";

import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly upload: UploadFileService
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
                    return await this.prisma.product.create({
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

        return this.prisma.product.update({
            where: { id: productId },
            data: updateData,
        });
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
                cursor: {
                    id: cursorId,
                },
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

        return {
            data: products,
            meta: {
                limit,
                hasNextPage,
                nextCursor: hasNextPage
                    ? products[products.length - 1].id
                    : null,
            },
        };
    }

    async getProductById(productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        return product;
    }
}
