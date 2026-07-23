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

const cleanDatabase = async () => {
    console.log("🧹 Cleaning database...");

    // Delete dependent records first if your schema has relations.
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
        },
        {
            name: "Product 2",
            description: "Description 2",
            price: 20,
            sku: generateSku(),
        },
        {
            name: "Product 3",
            description: "Description 3",
            price: 30,
            sku: generateSku(),
        },
    ];

    const result = await prisma.product.createMany({
        data: products,
    });

    console.log(`✅ Created ${result.count} product(s).`);
};

const main = async () => {
    console.log("🌱 Starting database seed...\n");

    const plainPassword = process.env.SEED_PASSWORD ?? "123456";

    console.log("🔐 Hashing seed password...");

    const hashedPassword = await argon2.hash(plainPassword);

    console.log("✅ Password hashed successfully.\n");

    await cleanDatabase();

    console.log("\n👥 Seeding users...");

    await seedAdmin(hashedPassword);
    await seedUser(hashedPassword);

    console.log("\n🛒 Seeding products...");

    await seedProducts();

    console.log("\n🎉 Database seed completed successfully!");
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
