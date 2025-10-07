-- DropIndex
DROP INDEX "public"."User_mobile_key";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "isDlt" SET DEFAULT false;
