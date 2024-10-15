-- AlterTable
ALTER TABLE "tool_input_rules" ADD COLUMN     "tool_input_category_id" INTEGER;

-- AddForeignKey
ALTER TABLE "tool_input_rules" ADD CONSTRAINT "fk_tool_input_category_id" FOREIGN KEY ("tool_input_category_id") REFERENCES "tool_input_categories"("tool_input_category_id") ON DELETE CASCADE ON UPDATE NO ACTION;
