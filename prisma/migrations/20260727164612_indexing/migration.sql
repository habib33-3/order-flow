/*
  Warnings:

  - A unique constraint covering the columns `[orderId,productId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
