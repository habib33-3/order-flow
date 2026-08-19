ALTER TABLE "Order"
ADD COLUMN "note" TEXT,
ADD COLUMN "shippingAddress" TEXT;

UPDATE "Order"
SET "shippingAddress" = '';

ALTER TABLE "Order"
ALTER COLUMN "shippingAddress" SET NOT NULL;