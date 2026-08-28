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

/**
 * Clean database
 *
 * Delete child records before parent records because of FK constraints.
 */
const cleanDatabase = async () => {
    console.log("🧹 Cleaning database...");

    const deletedCartItems = await prisma.cartItem.deleteMany();
    console.log(`✅ Deleted ${deletedCartItems.count} cart item(s).`);

    const deletedCarts = await prisma.cart.deleteMany();
    console.log(`✅ Deleted ${deletedCarts.count} cart(s).`);

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

/**
 * Seed admin
 */
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

/**
 * Seed regular user
 */
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

/**
 * Seed shipping addresses
 */
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

/**
 * Seed categories
 */
const seedCategories = async () => {
    console.log("🗂️ Creating categories...");

    const logo = "https://picsum.photos/100/100";

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

/**
 * Seed products
 */
const seedProducts = async (categoryId: string) => {
    console.log("🛒 Creating products...");

    const thumbnail = "https://picsum.photos/200/300";

    const images = [
        "https://picsum.photos/200/300",
        "https://picsum.photos/200/301",
        "https://picsum.photos/200/302",
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

/**
 * Seed cart
 */
const seedCart = async (
    userId: string,
    products: Awaited<ReturnType<typeof seedProducts>>
) => {
    console.log("🛍️ Creating cart...");

    if (products.length < 3) {
        throw new Error("At least 3 products are required to seed cart.");
    }

    const product1 = products[0];
    const product2 = products[1];
    const product3 = products[2];

    const cart = await prisma.cart.create({
        data: {
            userId,
            cartItems: {
                create: [
                    {
                        productId: product1.id,
                        quantity: 2,
                    },
                    {
                        productId: product2.id,
                        quantity: 1,
                    },
                    {
                        productId: product3.id,
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

const main = async () => {
    console.log("🌱 Starting database seed...\n");

    const plainPassword = process.env.SEED_PASSWORD ?? "123456";

    console.log("🔐 Hashing seed password...");

    const hashedPassword = await argon2.hash(plainPassword);

    console.log("✅ Password hashed successfully.\n");

    // --------------------------------------------------
    // Clean
    // --------------------------------------------------

    await cleanDatabase();

    // --------------------------------------------------
    // Users
    // --------------------------------------------------

    console.log("\n👥 Seeding users...");

    const admin = await seedAdmin(hashedPassword);
    const user = await seedUser(hashedPassword);

    // --------------------------------------------------
    // Shipping addresses
    // --------------------------------------------------

    console.log("\n📍 Seeding shipping addresses...");

    await seedShippingAddresses(user.id);

    // --------------------------------------------------
    // Categories
    // --------------------------------------------------

    console.log("\n🗂️ Seeding categories...");

    const categories = await seedCategories();

    if (categories.length === 0) {
        throw new Error("No categories were created.");
    }

    // --------------------------------------------------
    // Products
    // --------------------------------------------------

    console.log("\n🛒 Seeding products...");

    const products = await seedProducts(categories[0].id);

    // --------------------------------------------------
    // Cart
    // --------------------------------------------------

    console.log("\n🛍️ Seeding cart...");

    await seedCart(user.id, products);

    // --------------------------------------------------
    // Done
    // --------------------------------------------------

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
