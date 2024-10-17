/*
  Warnings:

  - You are about to drop the column `category_name` on the `tool_inputs_common` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tool_input_categories" ADD COLUMN     "common" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tool_inputs_common" DROP COLUMN "category_name",
ADD COLUMN     "tool_input_category_id" INTEGER;

-- AddForeignKey
ALTER TABLE "tool_inputs_common" ADD CONSTRAINT "fk_tool_input_category_id" FOREIGN KEY ("tool_input_category_id") REFERENCES "tool_input_categories"("tool_input_category_id") ON DELETE CASCADE ON UPDATE NO ACTION;
