-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "code" TEXT NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "minimumOrderAmount" DECIMAL(65,30),
    "maximumDiscountAmount" DECIMAL(65,30),
    "status" "CouponStatus" NOT NULL DEFAULT 'INACTIVE',
    "maxLimit" INTEGER NOT NULL DEFAULT 1,
    "remainingLimit" INTEGER NOT NULL DEFAULT 1,
    "maxLimitPerUser" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedeem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponRedeem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "CouponRedeem_couponId_idx" ON "CouponRedeem"("couponId");

-- CreateIndex
CREATE INDEX "CouponRedeem_userId_idx" ON "CouponRedeem"("userId");

-- CreateIndex
CREATE INDEX "CouponRedeem_couponId_userId_idx" ON "CouponRedeem"("couponId", "userId");

-- AddForeignKey
ALTER TABLE "CouponRedeem" ADD CONSTRAINT "CouponRedeem_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedeem" ADD CONSTRAINT "CouponRedeem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
