/*
  Warnings:

  - You are about to drop the column `fullday` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `halfday` on the `Attendance` table. All the data in the column will be lost.
  - Added the required column `fullDays` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `halfDays` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "fullday",
DROP COLUMN "halfday",
ADD COLUMN     "fullDays" INTEGER NOT NULL,
ADD COLUMN     "halfDays" INTEGER NOT NULL;
