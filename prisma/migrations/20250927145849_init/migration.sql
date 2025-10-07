/*
  Warnings:

  - Added the required column `submittedBy_id` to the `walkOut` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."walkOut" ADD COLUMN     "submittedBy_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."walkOut" ADD CONSTRAINT "walkOut_submittedBy_id_fkey" FOREIGN KEY ("submittedBy_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
