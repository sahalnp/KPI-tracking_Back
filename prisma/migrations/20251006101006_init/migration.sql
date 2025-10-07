/*
  Warnings:

  - You are about to drop the column `walkoutNameId` on the `walkOut` table. All the data in the column will be lost.
  - Added the required column `itemNameId` to the `walkOut` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."walkOut" DROP CONSTRAINT "walkOut_walkoutNameId_fkey";

-- AlterTable
ALTER TABLE "public"."walkOut" DROP COLUMN "walkoutNameId",
ADD COLUMN     "itemNameId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."walkOut" ADD CONSTRAINT "walkOut_itemNameId_fkey" FOREIGN KEY ("itemNameId") REFERENCES "public"."itemName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
