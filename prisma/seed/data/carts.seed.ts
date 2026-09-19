/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

import { seedProducts } from "./products.seed";

/**
 * Seed cart
 */
export const seedCarts = async (
    userId: string,
    products: Awaited<ReturnType<typeof seedProducts>>,
    prisma: PrismaClient
) => {
    console.log("🛍️ Creating cart...");

    if (products.length < 3) {
        throw new Error("At least 3 products are required to seed cart.");
    }

    const cart = await prisma.cart.create({
        data: {
            userId,
            cartItems: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 2,
                    },
                    {
                        productId: products[1].id,
                        quantity: 1,
                    },
                    {
                        productId: products[2].id,
                        quantity: 3,
                    },
                ],
            },
        },
        include: {
            cartItems: true,
        },
    });

    console.log(
        `✅ Created cart ${cart.id} with ${cart.cartItems.length} item(s).`
    );

    return cart;
};
