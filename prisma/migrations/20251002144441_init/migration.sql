/*
  Warnings:

  - You are about to drop the `OldProductSale` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SaleType" AS ENUM ('TRANSACTION', 'SUMMARY');

-- DropForeignKey
ALTER TABLE "public"."OldProductSale" DROP CONSTRAINT "OldProductSale_uploaded_by_id_fkey";

-- AlterTable
ALTER TABLE "public"."Sales" ADD COLUMN     "profit" DECIMAL(65,30),
ADD COLUMN     "qtySold" INTEGER,
ADD COLUMN     "sectionCode" TEXT,
ADD COLUMN     "targetQty" INTEGER,
ADD COLUMN     "type" "public"."SaleType" NOT NULL;

-- DropTable
DROP TABLE "public"."OldProductSale";
