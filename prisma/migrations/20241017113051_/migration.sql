/*
  Warnings:

  - You are about to drop the `tool_input_common_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tool_inputs_common` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tool_input_common_options" DROP CONSTRAINT "fk_tool_input_id";

-- DropForeignKey
ALTER TABLE "tool_inputs_common" DROP CONSTRAINT "fk_tool_input_category_id";

-- DropTable
DROP TABLE "tool_input_common_options";

-- DropTable
DROP TABLE "tool_inputs_common";
