/*
  Warnings:

  - You are about to drop the column `catalog` on the `default_input_values` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "default_input_values" DROP COLUMN "catalog",
ADD COLUMN     "new_tool" BOOLEAN NOT NULL DEFAULT false;
