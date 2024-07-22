/*
  Warnings:

  - You are about to drop the column `options` on the `tool_inputs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tool_inputs" DROP COLUMN "options",
ALTER COLUMN "property_name" DROP NOT NULL;
