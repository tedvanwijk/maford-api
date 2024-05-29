/*
  Warnings:

  - Added the required column `index` to the `series_inputs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "series_inputs" ADD COLUMN     "index" INTEGER NOT NULL;
