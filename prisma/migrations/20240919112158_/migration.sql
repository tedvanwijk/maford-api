/*
  Warnings:

  - Added the required column `value` to the `default_input_values` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "default_input_values" ADD COLUMN     "value" TEXT NOT NULL;
