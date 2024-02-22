/*
  Warnings:

  - Made the column `name` on table `specifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `path` on table `specifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `error` on table `specifications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "specifications" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "path" SET NOT NULL,
ALTER COLUMN "error" SET NOT NULL;
