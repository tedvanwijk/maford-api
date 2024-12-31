/*
  Warnings:

  - You are about to drop the column `required` on the `tool_inputs` table. All the data in the column will be lost.
  - You are about to drop the column `step_value` on the `tool_inputs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tool_inputs" DROP COLUMN "required",
DROP COLUMN "step_value";
