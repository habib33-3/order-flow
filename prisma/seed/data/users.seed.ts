/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

/**
 * Seed regular user
 */
export const seedUsers = async (password: string, prisma: PrismaClient) => {
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

    console.log(`✅ User created: ${user.email}`);

    return user;
};
