/*
  Warnings:

  - Replaces ProductStatus values with: DRAFT, ACTIVE, ARCHIVED.
  - Existing INACTIVE products will become ARCHIVED.
*/

-- Update existing enum values first
UPDATE "Product"
SET "status" = 'ACTIVE'
WHERE "status" = 'INACTIVE';

-- Or use ARCHIVED instead if that's your intended mapping:
-- UPDATE "Product"
-- SET "status" = 'ARCHIVED'
-- WHERE "status" = 'INACTIVE';

BEGIN;

CREATE TYPE "ProductStatus_new" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
);

ALTER TABLE "Product"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Product"
ALTER COLUMN "status"
TYPE "ProductStatus_new"
USING ("status"::text::"ProductStatus_new");

ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";

DROP TYPE "ProductStatus_old";

ALTER TABLE "Product"
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

COMMIT;

-- Add new columns
ALTER TABLE "Product"
ADD COLUMN "images" TEXT[];

-- If the table already contains data:
ALTER TABLE "Product"
ADD COLUMN "thumbnail" TEXT DEFAULT '';

UPDATE "Product"
SET "thumbnail" = ''
WHERE "thumbnail" IS NULL;

ALTER TABLE "Product"
ALTER COLUMN "thumbnail" SET NOT NULL,
ALTER COLUMN "thumbnail" DROP DEFAULT;