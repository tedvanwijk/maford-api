/*
  Warnings:

  - You are about to drop the column `catalog_index_same_as_index` on the `series_inputs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "series" ADD COLUMN     "catalog_index_same_as_index" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "series_inputs" DROP COLUMN "catalog_index_same_as_index";
