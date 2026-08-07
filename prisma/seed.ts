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

    // Delete in FK-safe order: children before parents.
    const deletedPayments = await prisma.payment.deleteMany();
    console.log(`✅ Deleted ${deletedPayments.count} payment(s).`);

    const deletedOrderItems = await prisma.orderItem.deleteMany();
    console.log(`✅ Deleted ${deletedOrderItems.count} order item(s).`);

    const deletedOrders = await prisma.order.deleteMany();
    console.log(`✅ Deleted ${deletedOrders.count} order(s).`);

    const deletedShippingAddresses = await prisma.shippingAddress.deleteMany();
    console.log(
        `✅ Deleted ${deletedShippingAddresses.count} shipping address(es).`
    );

    const deletedProducts = await prisma.product.deleteMany();
    console.log(`✅ Deleted ${deletedProducts.count} product(s).`);

    const deletedCategories = await prisma.category.deleteMany();
    console.log(`✅ Deleted ${deletedCategories.count} categories.`);

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
            status: "ACTIVE",
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
            status: "ACTIVE",
        },
    });

    console.log(`✅ User created successfully: ${user.email}`);
    return user;
};

const seedShippingAddresses = async (userId: string) => {
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
};

const seedCategories = async () => {
    console.log("🗂️ Creating categories...");

    const logo = "https://picsum.photos/100/100";
    const categories = [
        {
            name: "Electronics",
            description: "Electronic gadgets and devices",
            logo,
        },
        { name: "Books", description: "Physical and digital books", logo },
    ];

    const result = await prisma.category.createMany({
        data: categories,
    });
    console.log(`✅ Created ${result.count} categories.`);

    return prisma.category.findMany({
        orderBy: { createdAt: "asc" },
    });
};

const seedProducts = async (categoryId: string) => {
    console.log("🛒 Creating products...");

    const thumbnail = "https://picsum.photos/200/300";
    const images = [
        "https://picsum.photos/200/300",
        "https://picsum.photos/200/300",
        "https://picsum.photos/200/300",
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
            where: { id: product1.id },
            data: { stock: { decrement: order1Quantity1 } },
        });
        await tx.product.update({
            where: { id: product2.id },
            data: { stock: { decrement: order1Quantity2 } },
        });
        await tx.product.update({
            where: { id: product3.id },
            data: { stock: { decrement: order2Quantity } },
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
            include: { items: true },
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
            include: { items: true },
        });

        return { order1, order2 };
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

const seedPayments = async (
    userId: string,
    orders: Awaited<ReturnType<typeof seedOrders>>
) => {
    console.log("💳 Creating payments...");

    const { order1, order2 } = orders;

    const result = await prisma.$transaction(async (tx) => {
        // order1 is PAID -> a completed Stripe payment.
        const payment1 = await tx.payment.create({
            data: {
                orderId: order1.id,
                userId,
                amount: order1.total,
                status: "PAID",
                provider: "STRIPE",
                currency: "USD",
                idempotencyKey: `seed-${order1.id}`,
                transactionId: `pi_seed_${order1.id}`,
            },
        });

        // order2 is PENDING -> an initiated bKash payment awaiting completion.
        const payment2 = await tx.payment.create({
            data: {
                orderId: order2.id,
                userId,
                amount: order2.total,
                status: "PENDING",
                provider: "BKASH",
                currency: "USD",
                idempotencyKey: `seed-${order2.id}`,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            },
        });

        return { payment1, payment2 };
    });

    console.log(`✅ Created payment ${result.payment1.id} (PAID, STRIPE).`);
    console.log(`✅ Created payment ${result.payment2.id} (PENDING, BKASH).`);
    console.log("✅ Payments seeded successfully.");

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

    console.log("\n📍 Seeding shipping addresses...");
    await seedShippingAddresses(user.id);

    console.log("\n🗂️ Seeding categories...");
    const categories = await seedCategories();

    console.log("\n🛒 Seeding products...");
    const products = await seedProducts(categories[0].id);

    console.log("\n📦 Seeding orders...");
    const orders = await seedOrders(user.id, products);

    console.log("\n💳 Seeding payments...");
    await seedPayments(user.id, orders);

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
