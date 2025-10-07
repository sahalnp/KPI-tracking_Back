/*
  Warnings:

  - The values [owner] on the enum `role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[token]` on the table `Token` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."role_new" AS ENUM ('Owner', ' Floor-Supervisor', 'Manager', 'Accountant', 'Staff');
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."role_new" USING ("role"::text::"public"."role_new");
ALTER TYPE "public"."role" RENAME TO "role_old";
ALTER TYPE "public"."role_new" RENAME TO "role";
DROP TYPE "public"."role_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "public"."Token"("token");
