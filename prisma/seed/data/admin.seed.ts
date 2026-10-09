/* eslint-disable no-console */
import { PrismaClient } from "../../../src/generated/prisma/client";

/**
 * Seed admin
 */
export const seedAdmin = async (password: string, prisma: PrismaClient) => {
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

    console.log(`✅ Admin created: ${admin.email}`);

    return admin;
};
