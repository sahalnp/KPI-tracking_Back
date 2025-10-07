/*
  Warnings:

  - You are about to drop the column `type` on the `Attendance` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `half` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "type",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "full" INTEGER NOT NULL,
ADD COLUMN     "half" INTEGER NOT NULL,
ADD COLUMN     "leave" INTEGER NOT NULL;
