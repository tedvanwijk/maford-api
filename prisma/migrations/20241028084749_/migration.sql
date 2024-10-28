/*
  Warnings:

  - Made the column `boss_diameter_lower` on table `center_types` required. This step will fail if there are existing NULL values in that column.
  - Made the column `boss_diameter_upper` on table `center_types` required. This step will fail if there are existing NULL values in that column.
  - Made the column `boss_length_lower` on table `center_types` required. This step will fail if there are existing NULL values in that column.
  - Made the column `boss_length_upper` on table `center_types` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "center_types" ALTER COLUMN "boss_diameter_lower" SET NOT NULL,
ALTER COLUMN "boss_diameter_upper" SET NOT NULL,
ALTER COLUMN "boss_length_lower" SET NOT NULL,
ALTER COLUMN "boss_length_upper" SET NOT NULL;
