/*
  Warnings:

  - You are about to drop the column `uploaded_by` on the `OldProductSale` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `OldProductSale` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `OldProductSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaded_by_id` to the `OldProductSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ScoreStatus" AS ENUM ('pending', 'approved', 'rejected');

-- DropForeignKey
ALTER TABLE "public"."OldProductSale" DROP CONSTRAINT "OldProductSale_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."OldProductSale" DROP COLUMN "uploaded_by",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploaded_by_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Score" ADD COLUMN     "status" "public"."ScoreStatus" NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."OldProductSale" ADD CONSTRAINT "OldProductSale_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
