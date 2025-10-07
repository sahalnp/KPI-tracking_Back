/*
  Warnings:

  - Added the required column `target` to the `KPI` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."KPI" ADD COLUMN     "target" INTEGER NOT NULL;
