/*
  Warnings:

  - Made the column `scored_by_user_id` on table `Score` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_scored_by_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Score" ALTER COLUMN "scored_by_user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_scored_by_user_id_fkey" FOREIGN KEY ("scored_by_user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
