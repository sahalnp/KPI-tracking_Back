/*
  Warnings:

  - The values [ Floor-Supervisor] on the enum `role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."role_new" AS ENUM ('Owner', 'Floor-Supervisor', 'Manager', 'Accountant', 'Staff');
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."role_new" USING ("role"::text::"public"."role_new");
ALTER TYPE "public"."role" RENAME TO "role_old";
ALTER TYPE "public"."role_new" RENAME TO "role";
DROP TYPE "public"."role_old";
COMMIT;
