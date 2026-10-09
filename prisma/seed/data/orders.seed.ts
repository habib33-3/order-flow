/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

import { seedProducts } from "./products.seed";

/**
 * Seed order
 */
export const seedOrders = async (
    prisma: PrismaClient,
    userId: string,
    shippingAddress: string,
    products: Awaited<ReturnType<typeof seedProducts>>,
    couponId?: string
) => {
    console.log("📦 Creating order...");

    const product1 = products[0];
    const product2 = products[1];

    const quantity1 = 2;
    const quantity2 = 1;

    const subtotal =
        Number(product1.price) * quantity1 + Number(product2.price) * quantity2;

    let discount = 0;

    if (couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                id: couponId,
            },
        });

        if (!coupon) {
            throw new Error("Coupon not found.");
        }

        if (coupon.type === "PERCENTAGE") {
            discount = subtotal * (Number(coupon.discount) / 100);

            if (coupon.maximumDiscountAmount !== null) {
                discount = Math.min(
                    discount,
                    Number(coupon.maximumDiscountAmount)
                );
            }
        } else {
            discount = Number(coupon.discount);
        }

        discount = Math.min(discount, subtotal);
    }

    const total = subtotal - discount;

    const order = await prisma.order.create({
        data: {
            userId,
            shippingAddress,
            total,
            status: "CONFIRMED",
            note: "Seeded development order.",
            couponId,
            paidAt: new Date(),
            items: {
                create: [
                    {
                        productId: product1.id,
                        quantity: quantity1,
                        unitPrice: product1.price,
                        subtotal: Number(product1.price) * quantity1,
                    },
                    {
                        productId: product2.id,
                        quantity: quantity2,
                        unitPrice: product2.price,
                        subtotal: Number(product2.price) * quantity2,
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    console.log(
        `✅ Created order ${order.id} — subtotal: ${subtotal}, discount: ${discount}, total: ${total}`
    );

    return {
        order,
        subtotal,
        discount,
        total,
    };
};
