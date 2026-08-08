/*
  Warnings:

  - The values [PAID] on the enum `OrderStatus` will be removed.
*/

BEGIN;

-- Convert existing PAID orders before replacing the enum.
ALTER TABLE "public"."Order"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "public"."Order"
ALTER COLUMN "status" TYPE text;

UPDATE "public"."Order"
SET "status" = 'CONFIRMED'
WHERE "status" = 'PAID';

-- Create the new enum.
CREATE TYPE "public"."OrderStatus_new" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED'
);

-- Convert the column back to the enum.
ALTER TABLE "public"."Order"
ALTER COLUMN "status"
TYPE "public"."OrderStatus_new"
USING "status"::text::"public"."OrderStatus_new";

-- Replace the old enum.
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";

ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";

DROP TYPE "public"."OrderStatus_old";

-- Restore the default.
ALTER TABLE "public"."Order"
ALTER COLUMN "status" SET DEFAULT 'PENDING';

COMMIT;