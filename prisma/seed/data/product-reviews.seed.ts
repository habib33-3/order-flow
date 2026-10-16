/* eslint-disable no-console */
import { PrismaClient } from "../../../src/generated/prisma/client";
import { seedProducts } from "./products.seed";

/**
 * Seed product reviews
 */
export const seedProductReviews = async (
    userId: string,
    adminId: string,
    reviewerUserIds: string[],
    products: Awaited<ReturnType<typeof seedProducts>>,
    prisma: PrismaClient
) => {
    console.log("⭐ Creating product reviews...");

    if (products.length < 3) {
        throw new Error(
            "At least 3 products are required to seed product reviews."
        );
    }

    if (reviewerUserIds.length < 2) {
        throw new Error(
            "At least 2 additional reviewer users are required to ensure >= 3 reviews per product."
        );
    }

    const [reviewer1, reviewer2, reviewer3] = reviewerUserIds;

    // Ensure every product has at least 3 reviews (MIN_REVIEWS = 3)
    // while strictly observing @@unique([userId, productId]) — each user submits at most one review per product.
    const reviews = [
        // Product 0 (4 distinct reviewers)
        {
            userId,
            productId: products[0].id,
            rating: 5,
            review: "Exactly what I needed — solid build quality and fast shipping.",
        },
        {
            userId: adminId,
            productId: products[0].id,
            rating: 4,
            review: "Popular with customers; stock levels look healthy after seed orders.",
        },
        {
            userId: reviewer1,
            productId: products[0].id,
            rating: 5,
            review: "Great battery life and seamless setup. Highly recommended!",
        },
        {
            userId: reviewer2,
            productId: products[0].id,
            rating: 4,
            review: "Works as advertised. The design is sleek and comfortable to use.",
        },

        // Product 1 (4 distinct reviewers)
        {
            userId,
            productId: products[1].id,
            rating: 4,
            review: "Good value for the price; packaging could be a little sturdier.",
        },
        {
            userId: adminId,
            productId: products[1].id,
            rating: 4,
            review: "Frequently bundled with accessories; good repeat purchase rate.",
        },
        {
            userId: reviewer1,
            productId: products[1].id,
            rating: 3,
            review: "Decent quality for everyday use, performs well under regular load.",
        },
        {
            userId: reviewer3 ?? reviewer2,
            productId: products[1].id,
            rating: 5,
            review: "Exceeded my expectations given the price point. Very happy with the purchase.",
        },

        // Product 2 (4 distinct reviewers)
        {
            userId,
            productId: products[2].id,
            rating: 3,
            review: "Decent product overall, though setup took longer than expected.",
        },
        {
            userId: adminId,
            productId: products[2].id,
            rating: 5,
            review: "Strong seller in demos — descriptions and images represent it well.",
        },
        {
            userId: reviewer2,
            productId: products[2].id,
            rating: 5,
            review: "Impressive build materials, intuitive controls, and great customer support.",
        },
        {
            userId: reviewer3 ?? reviewer1,
            productId: products[2].id,
            rating: 4,
            review: "Solid purchase, arrived earlier than expected and matches the photos.",
        },
    ];

    const result = await prisma.productReview.createMany({
        data: reviews,
    });

    console.log(`✅ Created ${result.count} product review(s).`);

    return prisma.productReview.findMany({
        orderBy: {
            createdAt: "asc",
        },
    });
};
