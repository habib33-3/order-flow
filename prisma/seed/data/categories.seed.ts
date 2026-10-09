/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

/**
 * Seed categories
 */
export const seedCategories = async (prisma: PrismaClient) => {
    console.log("🗂️ Creating categories...");

    const logo = `https://picsum.photos/${Math.floor(Math.random() * 100)}/${Math.floor(Math.random() * 100)}`;

    const categories = [
        {
            name: "Electronics",
            description: "Electronic gadgets and devices",
            logo,
        },
        {
            name: "Books",
            description: "Physical and digital books",
            logo,
        },
    ];

    const result = await prisma.category.createMany({
        data: categories,
    });

    console.log(`✅ Created ${result.count} categories.`);

    return prisma.category.findMany({
        orderBy: {
            createdAt: "asc",
        },
    });
};
