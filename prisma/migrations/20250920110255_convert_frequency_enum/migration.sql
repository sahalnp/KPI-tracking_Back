/*
  Warnings:

  - You are about to drop the column `sort_order` on the `Floor` table. All the data in the column will be lost.
  - The primary key for the `KPI` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `KPI` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `frequency` on the `KPI` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `floor_id` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."Frequency" AS ENUM ('daily', 'weekly', 'monthly');

-- DropForeignKey
ALTER TABLE "public"."Leave" DROP CONSTRAINT "Leave_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."Leave" DROP CONSTRAINT "Leave_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OldProductSale" DROP CONSTRAINT "OldProductSale_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_kpi_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_scored_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_floor_id_fkey";

-- AlterTable
ALTER TABLE "public"."Floor" DROP COLUMN "sort_order";

-- AlterTable
ALTER TABLE "public"."KPI" DROP CONSTRAINT "KPI_pkey",
DROP COLUMN "name",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "frequency",
ADD COLUMN     "frequency" "public"."Frequency" NOT NULL,
ADD CONSTRAINT "KPI_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "KPI_id_seq";

-- AlterTable
ALTER TABLE "public"."Leave" ADD COLUMN     "isDlt" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "approved_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."OldProductSale" ADD COLUMN     "isDlt" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Score" ADD COLUMN     "isDlt" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "kpi_id" SET DATA TYPE TEXT,
ALTER COLUMN "scored_by_user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "floor_id" SET NOT NULL,
ALTER COLUMN "pin_hash" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "public"."Floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OldProductSale" ADD CONSTRAINT "OldProductSale_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Leave" ADD CONSTRAINT "Leave_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "public"."KPI"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_scored_by_user_id_fkey" FOREIGN KEY ("scored_by_user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
