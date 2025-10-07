/*
  Warnings:

  - Added the required column `staffId` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Sales" ADD COLUMN     "staffId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Sales" ADD CONSTRAINT "Sales_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
