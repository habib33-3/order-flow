/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import { generateSku } from "../src/common/utils/generate-sku";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set.");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: databaseUrl,
    }),
});

const generateStock = (min = 10, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const cleanDatabase = async () => {
    console.log("🧹 Cleaning database...");

    // OrderItem -> Order -> User/Product dependency chain
    const deletedOrderItems = await prisma.orderItem.deleteMany();
    console.log(`✅ Deleted ${deletedOrderItems.count} order item(s).`);

    const deletedOrders = await prisma.order.deleteMany();
    console.log(`✅ Deleted ${deletedOrders.count} order(s).`);

    const deletedProducts = await prisma.product.deleteMany();
    console.log(`✅ Deleted ${deletedProducts.count} product(s).`);

    const deletedUsers = await prisma.user.deleteMany();
    console.log(`✅ Deleted ${deletedUsers.count} user(s).`);

    console.log("✅ Database cleaned successfully.");
};

const seedAdmin = async (password: string) => {
    console.log("👤 Creating admin user...");

    const admin = await prisma.user.create({
        data: {
            name: "Admin",
            email: "admin@demo.com",
            password,
            role: "ADMIN",
        },
    });

    console.log(`✅ Admin created successfully: ${admin.email}`);

    return admin;
};

const seedUser = async (password: string) => {
    console.log("👤 Creating regular user...");

    const user = await prisma.user.create({
        data: {
            name: "User",
            email: "user@demo.com",
            password,
            role: "USER",
        },
    });

    console.log(`✅ User created successfully: ${user.email}`);

    return user;
};

const seedProducts = async () => {
    console.log("🛒 Creating products...");

    const products = [
        {
            name: "Product 1",
            description: "Description 1",
            price: 10,
            sku: generateSku(),
            stock: generateStock(),
        },
        {
            name: "Product 2",
            description: "Description 2",
            price: 20,
            sku: generateSku(),
            stock: generateStock(),
        },
        {
            name: "Product 3",
            description: "Description 3",
            price: 30,
            sku: generateSku(),
            stock: generateStock(),
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

const seedOrders = async (
    userId: string,
    products: Awaited<ReturnType<typeof seedProducts>>
) => {
    console.log("📦 Creating orders...");

    if (products.length < 3) {
        throw new Error("At least 3 products are required to seed orders.");
    }

    const product1 = products[0];
    const product2 = products[1];
    const product3 = products[2];

    const order1Quantity1 = 2;
    const order1Quantity2 = 1;

    const order1Subtotal1 = Number(product1.price) * order1Quantity1;

    const order1Subtotal2 = Number(product2.price) * order1Quantity2;

    const order1Total = order1Subtotal1 + order1Subtotal2;

    const order2Quantity = 3;

    const order2Subtotal = Number(product3.price) * order2Quantity;

    const order2Total = order2Subtotal;

    const result = await prisma.$transaction(async (tx) => {
        // Reduce stock for the products used in orders.
        await tx.product.update({
            where: {
                id: product1.id,
            },
            data: {
                stock: {
                    decrement: order1Quantity1,
                },
            },
        });

        await tx.product.update({
            where: {
                id: product2.id,
            },
            data: {
                stock: {
                    decrement: order1Quantity2,
                },
            },
        });

        await tx.product.update({
            where: {
                id: product3.id,
            },
            data: {
                stock: {
                    decrement: order2Quantity,
                },
            },
        });

        const order1 = await tx.order.create({
            data: {
                userId,
                total: order1Total,
                status: "PAID",
                paidAt: new Date(),
                items: {
                    create: [
                        {
                            productId: product1.id,
                            quantity: order1Quantity1,
                            unitPrice: product1.price,
                            subtotal: order1Subtotal1,
                        },
                        {
                            productId: product2.id,
                            quantity: order1Quantity2,
                            unitPrice: product2.price,
                            subtotal: order1Subtotal2,
                        },
                    ],
                },
            },
            include: {
                items: true,
            },
        });

        const order2 = await tx.order.create({
            data: {
                userId,
                total: order2Total,
                status: "PENDING",
                items: {
                    create: [
                        {
                            productId: product3.id,
                            quantity: order2Quantity,
                            unitPrice: product3.price,
                            subtotal: order2Subtotal,
                        },
                    ],
                },
            },
            include: {
                items: true,
            },
        });

        return {
            order1,
            order2,
        };
    });

    console.log(
        `✅ Created order ${result.order1.id} with ${result.order1.items.length} item(s).`
    );

    console.log(
        `✅ Created order ${result.order2.id} with ${result.order2.items.length} item(s).`
    );

    console.log("✅ Orders seeded successfully.");

    return result;
};

const main = async () => {
    console.log("🌱 Starting database seed...\n");

    const plainPassword = process.env.SEED_PASSWORD ?? "123456";

    console.log("🔐 Hashing seed password...");

    const hashedPassword = await argon2.hash(plainPassword);

    console.log("✅ Password hashed successfully.\n");

    await cleanDatabase();

    console.log("\n👥 Seeding users...");

    const admin = await seedAdmin(hashedPassword);
    const user = await seedUser(hashedPassword);

    console.log("\n🛒 Seeding products...");

    const products = await seedProducts();

    console.log("\n📦 Seeding orders...");

    await seedOrders(user.id, products);

    console.log("\n🎉 Database seed completed successfully!");
    console.log("\n📋 Seed credentials:");
    console.log(`Admin: ${admin.email}`);
    console.log(`User: ${user.email}`);
    console.log(`Password: ${plainPassword}`);
};

main()
    .catch((error) => {
        console.error("\n❌ Database seed failed!");
        console.error(error);

        process.exitCode = 1;
    })
    .finally(async () => {
        console.log("\n🔌 Disconnecting from database...");

        await prisma.$disconnect();

        console.log("✅ Database disconnected.");
    });
