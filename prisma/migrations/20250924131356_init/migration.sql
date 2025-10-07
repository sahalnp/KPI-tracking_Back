/*
  Warnings:

  - You are about to drop the column `status` on the `Attendance` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."Type" ADD VALUE 'leave';

-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."AttendanceStatus";
