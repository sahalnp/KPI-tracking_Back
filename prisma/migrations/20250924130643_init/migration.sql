/*
  Warnings:

  - The values [leave] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `type` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Type" AS ENUM ('half', 'full');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."AttendanceStatus_new" AS ENUM ('present', 'absent');
ALTER TABLE "public"."Attendance" ALTER COLUMN "status" TYPE "public"."AttendanceStatus_new" USING ("status"::text::"public"."AttendanceStatus_new");
ALTER TYPE "public"."AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "public"."AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "public"."AttendanceStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "type" "public"."Type" NOT NULL;
