/*
  Warnings:

  - Added the required column `title` to the `ShippingAddress` table without a default value. This is not possible if the table is not empty.



*/
-- AlterTable



ALTER TABLE "ShippingAddress" ADD COLUMN     "title" TEXT NOT NULL;
