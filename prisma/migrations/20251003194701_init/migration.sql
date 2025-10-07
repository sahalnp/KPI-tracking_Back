/*
  Warnings:

  - You are about to drop the column `staffId` on the `Sales` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Sales" DROP CONSTRAINT "Sales_staffId_fkey";

-- AlterTable
ALTER TABLE "public"."Sales" DROP COLUMN "staffId";
