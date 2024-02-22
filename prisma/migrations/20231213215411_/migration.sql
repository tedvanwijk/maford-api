/*
  Warnings:

  - Added the required column `tool_id` to the `tool_inputs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tool_inputs" ADD COLUMN     "tool_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "tool_inputs" ADD CONSTRAINT "fk_tool_id" FOREIGN KEY ("tool_id") REFERENCES "tools"("tool_id") ON DELETE CASCADE ON UPDATE NO ACTION;
