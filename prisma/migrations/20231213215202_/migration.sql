/*
  Warnings:

  - Made the column `tool_id` on table `series` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "series" ALTER COLUMN "tool_id" SET NOT NULL;
