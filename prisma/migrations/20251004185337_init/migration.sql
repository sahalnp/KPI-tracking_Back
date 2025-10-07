/*
  Warnings:

  - You are about to drop the column `full` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `half` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `leave` on the `Attendance` table. All the data in the column will be lost.
  - Added the required column `fullday` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `halfday` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveCount` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "full",
DROP COLUMN "half",
DROP COLUMN "leave",
ADD COLUMN     "fullday" INTEGER NOT NULL,
ADD COLUMN     "halfday" INTEGER NOT NULL,
ADD COLUMN     "leaveCount" INTEGER NOT NULL;
