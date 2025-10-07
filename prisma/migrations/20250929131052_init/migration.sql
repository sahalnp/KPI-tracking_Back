/*
  Warnings:

  - Added the required column `priority` to the `walkOut` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "pin_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."walkOut" ADD COLUMN     "priority" "public"."Priority" NOT NULL;
