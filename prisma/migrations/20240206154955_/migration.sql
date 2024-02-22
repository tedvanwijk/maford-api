-- AlterTable
ALTER TABLE "tool_input_categories" ALTER COLUMN "tool_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tool_inputs" ALTER COLUMN "tool_id" DROP NOT NULL;
