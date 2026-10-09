/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

/**
 * Seed payment
 */
export const seedPayments = async (
    userId: string,
    orderId: string,
    amount: number,
    prisma: PrismaClient
) => {
    console.log("💳 Creating payment...");

    const payment = await prisma.payment.create({
        data: {
            amount,
            status: "PAID",
            provider: "STRIPE",
            currency: "USD",
            idempotencyKey: `seed-${orderId}`,
            transactionId: `txn_seed_${orderId}`,
            orderId,
            userId,
        },
    });

    console.log(`✅ Created payment ${payment.id}.`);

    return payment;
};
