/*
  Warnings:

  - Added the required column `name` to the `KPI` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."KPI" ADD COLUMN     "name" TEXT NOT NULL;
