/*
  Warnings:

  - You are about to drop the column `date` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `locked_at` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `scored_by_user_id` on the `Score` table. All the data in the column will be lost.
  - Added the required column `evalutedDate` to the `Score` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evalutedby_user_id` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_scored_by_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Score" DROP COLUMN "date",
DROP COLUMN "locked_at",
DROP COLUMN "scored_by_user_id",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "evalutedDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "evalutedby_user_id" TEXT NOT NULL,
ADD COLUMN     "trend" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_evalutedby_user_id_fkey" FOREIGN KEY ("evalutedby_user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
