/*
  Warnings:

  - Made the column `required` on table `tool_inputs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tool_inputs" ALTER COLUMN "required" SET NOT NULL;
