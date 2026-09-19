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

    const deletedCouponRedeems = await prisma.couponRedeem.deleteMany();
    console.log(`✅ Deleted ${deletedCouponRedeems.count} coupon redeem(s).`);

    const deletedCoupons = await prisma.coupon.deleteMany();
    console.log(`✅ Deleted ${deletedCoupons.count} coupon(s).`);

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

    console.log(`✅ Admin created: ${admin.email}`);

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

    console.log(`✅ User created: ${user.email}`);

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

    return prisma.shippingAddress.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
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

    const cart = await prisma.cart.create({
        data: {
            userId,
            cartItems: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 2,
                    },
                    {
                        productId: products[1].id,
                        quantity: 1,
                    },
                    {
                        productId: products[2].id,
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

/**
 * Seed coupons
 */
const seedCoupons = async () => {
    console.log("🎟️ Creating coupons...");

    const now = new Date();

    const coupons = [
        {
            code: "WELCOME10",
            type: "PERCENTAGE" as const,
            discount: 10,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: 20,
            maximumDiscountAmount: 50,
            status: "ACTIVE" as const,
            maxLimit: 100,
            remainingLimit: 100,
            maxLimitPerUser: 1,
        },
        {
            code: "SAVE20",
            type: "FIXED" as const,
            discount: 20,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: 50,
            maximumDiscountAmount: null,
            status: "ACTIVE" as const,
            maxLimit: 50,
            remainingLimit: 50,
            maxLimitPerUser: 1,
        },
        {
            code: "BIGSALE25",
            type: "PERCENTAGE" as const,
            discount: 25,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: 100,
            maximumDiscountAmount: 100,
            status: "ACTIVE" as const,
            maxLimit: 25,
            remainingLimit: 25,
            maxLimitPerUser: 2,
        },
        {
            code: "INACTIVE10",
            type: "PERCENTAGE" as const,
            discount: 10,
            startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            minimumOrderAmount: null,
            maximumDiscountAmount: null,
            status: "INACTIVE" as const,
            maxLimit: 100,
            remainingLimit: 100,
            maxLimitPerUser: 1,
        },
    ];

    const result = await prisma.coupon.createMany({
        data: coupons,
    });

    console.log(`✅ Created ${result.count} coupon(s).`);

    return prisma.coupon.findMany({
        orderBy: {
            createdAt: "asc",
        },
    });
};

/**
 * Seed coupon redemption
 */
const seedCouponRedeem = async (userId: string, couponId: string) => {
    console.log("🎟️ Creating coupon redemption...");

    const redeem = await prisma.couponRedeem.create({
        data: {
            userId,
            couponId,
        },
    });

    console.log(`✅ Created coupon redemption: ${redeem.id}`);

    return redeem;
};

/**
 * Seed order
 */
const seedOrder = async (
    userId: string,
    shippingAddress: string,
    products: Awaited<ReturnType<typeof seedProducts>>,
    couponId?: string
) => {
    console.log("📦 Creating order...");

    const product1 = products[0];
    const product2 = products[1];

    const quantity1 = 2;
    const quantity2 = 1;

    const subtotal =
        Number(product1.price) * quantity1 + Number(product2.price) * quantity2;

    let discount = 0;

    if (couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                id: couponId,
            },
        });

        if (!coupon) {
            throw new Error("Coupon not found.");
        }

        if (coupon.type === "PERCENTAGE") {
            discount = subtotal * (Number(coupon.discount) / 100);

            if (coupon.maximumDiscountAmount !== null) {
                discount = Math.min(
                    discount,
                    Number(coupon.maximumDiscountAmount)
                );
            }
        } else {
            discount = Number(coupon.discount);
        }

        discount = Math.min(discount, subtotal);
    }

    const total = subtotal - discount;

    const order = await prisma.order.create({
        data: {
            userId,
            shippingAddress,
            total,
            status: "CONFIRMED",
            note: "Seeded development order.",
            couponId,
            paidAt: new Date(),
            items: {
                create: [
                    {
                        productId: product1.id,
                        quantity: quantity1,
                        unitPrice: product1.price,
                        subtotal: Number(product1.price) * quantity1,
                    },
                    {
                        productId: product2.id,
                        quantity: quantity2,
                        unitPrice: product2.price,
                        subtotal: Number(product2.price) * quantity2,
                    },
                ],
            },
        },
        include: {
            items: true,
        },
    });

    console.log(
        `✅ Created order ${order.id} — subtotal: ${subtotal}, discount: ${discount}, total: ${total}`
    );

    return {
        order,
        subtotal,
        discount,
        total,
    };
};

/**
 * Seed payment
 */
const seedPayment = async (userId: string, orderId: string, amount: number) => {
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

    const shippingAddresses = await seedShippingAddresses(user.id);

    if (shippingAddresses.length === 0) {
        throw new Error("No shipping addresses were created.");
    }

    // --------------------------------------------------
    // Categories
    // --------------------------------------------------

    console.log("\n🗂️ Seeding categories...");

    const categories = await seedCategories();

    if (categories.length < 2) {
        throw new Error("At least 2 categories are required.");
    }

    // --------------------------------------------------
    // Products
    // --------------------------------------------------

    console.log("\n🛒 Seeding products...");

    const products = await seedProducts(categories[0].id);

    if (products.length < 3) {
        throw new Error("At least 3 products are required.");
    }

    // --------------------------------------------------
    // Cart
    // --------------------------------------------------

    console.log("\n🛍️ Seeding cart...");

    await seedCart(user.id, products);

    // --------------------------------------------------
    // Coupons
    // --------------------------------------------------

    console.log("\n🎟️ Seeding coupons...");

    const coupons = await seedCoupons();

    const welcomeCoupon = coupons.find((coupon) => coupon.code === "WELCOME10");

    if (!welcomeCoupon) {
        throw new Error("WELCOME10 coupon was not created.");
    }

    // --------------------------------------------------
    // Coupon redemption
    // --------------------------------------------------

    console.log("\n🎟️ Seeding coupon redemption...");

    await seedCouponRedeem(user.id, welcomeCoupon.id);

    // --------------------------------------------------
    // Order
    // --------------------------------------------------

    console.log("\n📦 Seeding order...");

    const shippingAddress = shippingAddresses[0];

    const seededOrder = await seedOrder(
        user.id,
        `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postalCode}, ${shippingAddress.country}`,
        products,
        welcomeCoupon.id
    );

    // --------------------------------------------------
    // Payment
    // --------------------------------------------------

    console.log("\n💳 Seeding payment...");

    await seedPayment(user.id, seededOrder.order.id, seededOrder.total);

    // --------------------------------------------------
    // Done
    // --------------------------------------------------

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
    console.log(`Coupons: ${coupons.length}`);
    console.log(`Coupon redemptions: 1`);
    console.log(`Orders: 1`);
    console.log(`Order items: ${seededOrder.order.items.length}`);
    console.log(`Payments: 1`);
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
