/*
  Warnings:

  - You are about to drop the column `tool_input_dependency_id` on the `tool_input_rules` table. All the data in the column will be lost.
  - Added the required column `tool_input_dependency_id_1` to the `tool_input_rules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tool_input_rules" DROP CONSTRAINT "fk_tool_input_dependency_id";

-- AlterTable
ALTER TABLE "tool_input_rules" DROP COLUMN "tool_input_dependency_id",
ADD COLUMN     "tool_input_dependency_id_1" INTEGER NOT NULL,
ADD COLUMN     "tool_input_dependency_id_2" INTEGER;

-- AddForeignKey
ALTER TABLE "tool_input_rules" ADD CONSTRAINT "fk_tool_input_dependency_id_1" FOREIGN KEY ("tool_input_dependency_id_1") REFERENCES "tool_inputs"("tool_input_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tool_input_rules" ADD CONSTRAINT "fk_tool_input_dependency_id_2" FOREIGN KEY ("tool_input_dependency_id_2") REFERENCES "tool_inputs"("tool_input_id") ON DELETE CASCADE ON UPDATE NO ACTION;
