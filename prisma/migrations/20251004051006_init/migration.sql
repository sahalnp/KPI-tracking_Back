/*
  Warnings:

  - You are about to drop the column `scoreId` on the `Sales` table. All the data in the column will be lost.
  - You are about to alter the column `per` on the `Sales` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - Added the required column `points` to the `Sales` table without a default value. This is not possible if the table is not empty.
  - Made the column `per` on table `Sales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Sales" DROP CONSTRAINT "Sales_scoreId_fkey";

-- AlterTable
ALTER TABLE "public"."Sales" DROP COLUMN "scoreId",
ADD COLUMN     "points" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "per" SET NOT NULL,
ALTER COLUMN "per" SET DATA TYPE DECIMAL(65,30);
