/*
  Warnings:

  - A unique constraint covering the columns `[staffId,year_code]` on the table `Sales` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Sales_staffId_year_code_key" ON "public"."Sales"("staffId", "year_code");
