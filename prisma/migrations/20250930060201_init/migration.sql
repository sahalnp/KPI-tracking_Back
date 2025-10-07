/*
  Warnings:

  - You are about to drop the column `name` on the `walkOut` table. All the data in the column will be lost.
  - Added the required column `walkoutNameId` to the `walkOut` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."walkOut" DROP COLUMN "name",
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "walkoutNameId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."walkoutName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isDlt" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "walkoutName_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."walkOut" ADD CONSTRAINT "walkOut_walkoutNameId_fkey" FOREIGN KEY ("walkoutNameId") REFERENCES "public"."walkoutName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
