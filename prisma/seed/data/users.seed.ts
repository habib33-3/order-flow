/* eslint-disable no-console */
import { PrismaClient } from "../../../src/generated/prisma/client";

/**
 * Seed regular users
 */
export const seedUsers = async (password: string, prisma: PrismaClient) => {
    console.log("👤 Creating regular users...");

    const usersData = [
        {
            name: "User",
            email: "user@demo.com",
            password,
            role: "USER" as const,
            status: "ACTIVE" as const,
        },
        {
            name: "Sarah Miller",
            email: "sarah@demo.com",
            password,
            role: "USER" as const,
            status: "ACTIVE" as const,
        },
        {
            name: "Alex Rivera",
            email: "alex@demo.com",
            password,
            role: "USER" as const,
            status: "ACTIVE" as const,
        },
        {
            name: "David Chen",
            email: "david@demo.com",
            password,
            role: "USER" as const,
            status: "ACTIVE" as const,
        },
    ];

    const users = await Promise.all(
        usersData.map((data) => prisma.user.create({ data }))
    );

    console.log(
        `✅ Created ${users.length} regular user(s): ${users.map((u) => u.email).join(", ")}`
    );

    return users;
};
