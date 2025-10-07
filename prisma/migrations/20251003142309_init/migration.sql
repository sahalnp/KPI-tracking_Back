/*
  Warnings:

  - You are about to drop the column `sales_id` on the `Upload` table. All the data in the column will be lost.
  - Added the required column `uploadId` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Upload" DROP CONSTRAINT "Upload_sales_id_fkey";

-- AlterTable
ALTER TABLE "public"."Sales" ADD COLUMN     "uploadId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Upload" DROP COLUMN "sales_id";

-- AddForeignKey
ALTER TABLE "public"."Sales" ADD CONSTRAINT "Sales_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "public"."Upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
