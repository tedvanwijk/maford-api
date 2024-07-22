/*
  Warnings:

  - A unique constraint covering the columns `[series_id,index]` on the table `series_inputs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "series_inputs_series_id_index_key" ON "series_inputs"("series_id", "index");
