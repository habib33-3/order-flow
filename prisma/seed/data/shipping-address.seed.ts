/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

/**
 * Seed shipping addresses
 */
export const seedShippingAddresses = async (
    userId: string,
    prisma: PrismaClient
) => {
    console.log("📍 Creating shipping addresses...");

    const result = await prisma.shippingAddress.createMany({
        data: [
            {
                userId,
                title: "Hogwarts",
                address: "Gryffindor Tower, Hogwarts Castle",
                city: "Hogsmeade",
                state: "Scottish Highlands",
                postalCode: "HP001",
                country: "Wizarding World",
            },
            {
                userId,
                title: "The Shire",
                address: "Bag End, Bagshot Row",
                city: "Hobbiton",
                state: "Westfarthing",
                postalCode: "LOTR001",
                country: "Middle-earth",
            },
        ],
    });

    console.log(`✅ Created ${result.count} shipping address(es).`);

    return prisma.shippingAddress.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
};
