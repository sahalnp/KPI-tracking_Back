/*
  Warnings:

  - Added the required column `status` to the `Leave` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "public"."Leave" ADD COLUMN     "status" "public"."Status" NOT NULL;
