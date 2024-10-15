/*
  Warnings:

  - You are about to drop the column `tool_input_category_id` on the `tool_input_rules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tool_input_rules" DROP CONSTRAINT "fk_tool_input_category_id";

-- AlterTable
ALTER TABLE "tool_input_rules" DROP COLUMN "tool_input_category_id";
