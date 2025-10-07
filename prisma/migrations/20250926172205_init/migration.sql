/*
  Warnings:

  - The values [leave] on the enum `Type` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `status` to the `KPI` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Type_new" AS ENUM ('half', 'full', 'leavem');
ALTER TABLE "public"."Attendance" ALTER COLUMN "type" TYPE "public"."Type_new" USING ("type"::text::"public"."Type_new");
ALTER TYPE "public"."Type" RENAME TO "Type_old";
ALTER TYPE "public"."Type_new" RENAME TO "Type";
DROP TYPE "public"."Type_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."KPI" ADD COLUMN     "status" BOOLEAN NOT NULL;
