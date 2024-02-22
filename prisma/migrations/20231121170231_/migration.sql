/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `series` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "series_name_key" ON "series"("name");
