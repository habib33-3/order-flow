/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import { PrismaClient } from "../../src/generated/prisma/client";
import { seedAdmin } from "./data/admin.seed";
import { seedCarts } from "./data/carts.seed";
import { seedCategories } from "./data/categories.seed";
import { seedCoupons } from "./data/coupons.seed";
import { seedOrders } from "./data/orders.seed";
import { seedPayments } from "./data/payment.seed";
import { seedProducts } from "./data/products.seed";
import { seedShippingAddresses } from "./data/shipping-address.seed";
import { seedUsers } from "./data/users.seed";
import { cleanDatabase } from "./utils/clean-database";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set.");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: databaseUrl,
    }),
});

export const runSeed = async () => {
    console.log("🌱 Starting database seed...\n");

    const plainPassword = process.env.SEED_PASSWORD ?? "123456";

    console.log("🔐 Hashing seed password...");

    const hashedPassword = await argon2.hash(plainPassword);

    console.log("✅ Password hashed successfully.\n");

    await cleanDatabase(prisma);

    const admin = await seedAdmin(hashedPassword, prisma);

    const user = await seedUsers(hashedPassword, prisma);

    const categories = await seedCategories(prisma);

    const products = await seedProducts(categories[0].id, prisma);

    const shippingAddresses = await seedShippingAddresses(user.id, prisma);

    const cart = await seedCarts(user.id, products, prisma);

    const coupons = await seedCoupons(prisma);

    const order = await seedOrders(
        prisma,
        user.id,
        shippingAddresses[0].address,
        products,
        coupons[0].id
    );

    const payment = await seedPayments(
        user.id,
        order.order.id,
        order.total,
        prisma
    );

    console.log("\n🎉 Database seed completed successfully!");

    console.log("\n📋 Seed credentials:");
    console.log(`Admin: ${admin.email}`);
    console.log(`User: ${user.email}`);
    console.log(`Password: ${plainPassword}`);

    console.log("\n📊 Seed summary:");
    console.log(`Users: 2`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Shipping addresses: ${shippingAddresses.length}`);
    console.log(`Cart items: ${cart.cartItems.length}`);
    console.log(`Coupons: ${coupons.length}`);
    console.log(`Orders: 1`);
    console.log(`Order items: ${order.order.items.length}`);
    console.log(`Payments: 1`);
    console.log(`Payment: ${payment.id}`);
};

export const disconnectSeedDatabase = async () => {
    await prisma.$disconnect();
};
