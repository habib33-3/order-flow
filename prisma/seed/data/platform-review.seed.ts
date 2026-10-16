/* eslint-disable no-console */
import { PrismaClient } from "../../../src/generated/prisma/client";

/**
 * Seed platform reviews
 */
export const seedPlatformReviews = async (
    userId: string,
    adminId: string,
    prisma: PrismaClient
) => {
    console.log("⭐ Creating platform reviews...");

    const reviews = [
        {
            userId,
            rating: 5,
            review: "Smooth checkout, clear order tracking, and delivery matched what I expected.",
        },
        {
            userId: adminId,
            rating: 4,
            review: "Admin tooling is straightforward; catalog and coupon management work well in dev.",
        },
    ];

    const result = await prisma.platformReview.createMany({
        data: reviews,
    });

    console.log(`✅ Created ${result.count} platform review(s).`);

    return prisma.platformReview.findMany({
        orderBy: {
            createdAt: "asc",
        },
    });
};
