import { randomBytes } from "node:crypto";

import { ConflictException, Injectable } from "@nestjs/common";

import { Decimal } from "@prisma/client/runtime/client";
import { PrismaService } from "src/common/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";

import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}

    private generateSku() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = randomBytes(2).toString("hex").toUpperCase();

        return `SKU-${timestamp}-${random}`;
    }

    async createProduct(payload: CreateProductDto) {
        const MAX_RETRIES = 3;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const decimalPrice = new Decimal(payload.price).toDecimalPlaces(
                    2
                );

                return await this.prisma.product.create({
                    data: {
                        name: payload.name,
                        description: payload.description,
                        price: decimalPrice,
                        stock: payload.stock,
                        sku: this.generateSku(),
                        status: payload.status,
                    },
                });
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002"
                ) {
                    if (attempt === MAX_RETRIES - 1) {
                        throw new ConflictException(
                            "Unable to generate a unique SKU after 3 attempts"
                        );
                    }

                    continue;
                }

                throw error;
            }
        }
    }

    async updateProduct(payload: UpdateProductDto, productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new ConflictException("Product not found");
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
            throw new ConflictException("Product not found");
        }

        await this.prisma.product.delete({
            where: { id: productId },
        });

        return {
            message: "Product deleted successfully",
        };
    }
}
