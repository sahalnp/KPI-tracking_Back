/*
  Warnings:

  - Added the required column `prodValue` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Sales" ADD COLUMN     "prodValue" DECIMAL(65,30) NOT NULL;
