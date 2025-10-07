/*
  Warnings:

  - You are about to drop the column `count` on the `walkOut` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `itemName` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `itemType` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."walkOut" DROP COLUMN "count";

-- CreateIndex
CREATE UNIQUE INDEX "itemName_name_key" ON "public"."itemName"("name");

-- CreateIndex
CREATE UNIQUE INDEX "itemType_name_key" ON "public"."itemType"("name");
