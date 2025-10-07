/*
  Warnings:

  - Changed the type of `pin_hash` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."role" AS ENUM ('owner', ' Floor-Supervisor', 'Manager', 'Accountant', 'Staff');

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "pin_hash",
ADD COLUMN     "pin_hash" INTEGER NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."role" NOT NULL;

-- DropEnum
DROP TYPE "public"."UserRole";
