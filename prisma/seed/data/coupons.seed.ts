/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

/**
 * Seed coupons
 */
export const seedCoupons = async (prisma: PrismaClient) => {
    console.log("🎟️ Creating coupons...");

    const now = new Date();

    const coupons = [
        {
            code: "WELCOME10",
            type: "PERCENTAGE" as const,
            discount: 10,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: 20,
            maximumDiscountAmount: 50,
            status: "ACTIVE" as const,
            maxLimit: 100,
            remainingLimit: 100,
            maxLimitPerUser: 1,
        },
        {
            code: "SAVE20",
            type: "FIXED" as const,
            discount: 20,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: 50,
            maximumDiscountAmount: null,
            status: "ACTIVE" as const,
            maxLimit: 50,
            remainingLimit: 50,
            maxLimitPerUser: 1,
        },
        {
            code: "BIGSALE25",
            type: "PERCENTAGE" as const,
            discount: 25,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: 100,
            maximumDiscountAmount: 100,
            status: "ACTIVE" as const,
            maxLimit: 25,
            remainingLimit: 25,
            maxLimitPerUser: 2,
        },
        {
            code: "INACTIVE10",
            type: "PERCENTAGE" as const,
            discount: 10,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: null,
            maximumDiscountAmount: null,
            status: "INACTIVE" as const,
            maxLimit: 100,
            remainingLimit: 100,
            maxLimitPerUser: 1,
        },
    ];

    const result = await prisma.coupon.createMany({
        data: coupons,
    });

    console.log(`✅ Created ${result.count} coupon(s).`);

    return prisma.coupon.findMany({
        orderBy: {
            createdAt: "asc",
        },
    });
};
