/*
  Warnings:

  - You are about to drop the column `netQty` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the `walkoutName` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type_id` to the `walkOut` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."walkOut" DROP CONSTRAINT "walkOut_walkoutNameId_fkey";

-- AlterTable
ALTER TABLE "public"."Sales" DROP COLUMN "netQty";

-- AlterTable
ALTER TABLE "public"."walkOut" ADD COLUMN     "type_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."walkoutName";

-- CreateTable
CREATE TABLE "public"."itemName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "itemName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itemType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "itemType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."walkOut" ADD CONSTRAINT "walkOut_walkoutNameId_fkey" FOREIGN KEY ("walkoutNameId") REFERENCES "public"."itemName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."walkOut" ADD CONSTRAINT "walkOut_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."itemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
