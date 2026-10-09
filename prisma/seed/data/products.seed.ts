/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

import { generateSku } from "../../../src/common/utils/generate-sku";

const generateStock = (min = 10, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Seed products
 */
export const seedProducts = async (
    categoryId: string,
    prisma: PrismaClient
) => {
    console.log("🛒 Creating products...");

    const thumbnail = "https://picsum.photos/200/300";

    const images = [
        "https://picsum.photos/200/300",
        "https://picsum.photos/200/301",
        "https://picsum.photos/200/302",
    ];

    const products = [
        {
            name: "Product 1",
            description: "Description 1",
            price: 10,
            sku: generateSku(),
            stock: generateStock(),
            thumbnail,
            images,
            categoryId,
            status: "ACTIVE" as const,
        },
        {
            name: "Product 2",
            description: "Description 2",
            price: 20,
            sku: generateSku(),
            stock: generateStock(),
            thumbnail,
            images,
            categoryId,
            status: "ACTIVE" as const,
        },
        {
            name: "Product 3",
            description: "Description 3",
            price: 30,
            sku: generateSku(),
            stock: generateStock(),
            thumbnail,
            images,
            categoryId,
            status: "ACTIVE" as const,
        },
    ];

    const result = await prisma.product.createMany({
        data: products,
    });

    console.log(`✅ Created ${result.count} product(s).`);

    return prisma.product.findMany({
        orderBy: {
            createdAt: "asc",
        },
    });
};
