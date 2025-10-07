/*
  Warnings:

  - You are about to drop the column `billId` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the column `sectionCode` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the column `targetQty` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Sales` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_kpi_id_fkey";

-- AlterTable
ALTER TABLE "public"."Sales" DROP COLUMN "billId",
DROP COLUMN "date",
DROP COLUMN "sectionCode",
DROP COLUMN "targetQty",
DROP COLUMN "type",
ADD COLUMN     "netQty" INTEGER,
ADD COLUMN     "per" DOUBLE PRECISION,
ADD COLUMN     "scoreId" INTEGER,
ADD COLUMN     "year_code" TEXT;

-- AlterTable
ALTER TABLE "public"."Score" ALTER COLUMN "kpi_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Sales" ADD CONSTRAINT "Sales_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "public"."Score"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "public"."KPI"("id") ON DELETE SET NULL ON UPDATE CASCADE;
