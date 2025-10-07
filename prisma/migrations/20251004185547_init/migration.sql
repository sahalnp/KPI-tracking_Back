/*
  Warnings:

  - Added the required column `totalDays` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "totalDays" TEXT NOT NULL,
ALTER COLUMN "leaveCount" SET DATA TYPE TEXT,
ALTER COLUMN "fullDays" SET DATA TYPE TEXT,
ALTER COLUMN "halfDays" SET DATA TYPE TEXT;
