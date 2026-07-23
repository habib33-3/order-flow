/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    }),
});

async function cleanDatabase() {
    console.log("🧹 Cleaning database...");

    const deletedUsers = await prisma.user.deleteMany();

    console.log(`✅ Deleted ${deletedUsers.count} user(s).`);
}

async function seedAdmin(password: string) {
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
}

async function seedUser(password: string) {
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
}

async function main() {
    console.log("🌱 Starting database seed...\n");

    const plainPassword = process.env.SEED_PASSWORD ?? "123456";

    console.log("🔐 Hashing seed password...");
    const hashedPassword = await argon2.hash(plainPassword);
    console.log("✅ Password hashed successfully.\n");

    await cleanDatabase();
    console.log("");

    await seedAdmin(hashedPassword);
    await seedUser(hashedPassword);

    console.log("\n🎉 Database seed completed successfully!");
}

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
