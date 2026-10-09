/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client/extension";

/**
 * Clean database
 *
 * Delete child records before parent records because of FK constraints.
 */
export const cleanDatabase = async (prisma: PrismaClient) => {
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
