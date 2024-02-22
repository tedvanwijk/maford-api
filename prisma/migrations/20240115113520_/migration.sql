-- AlterTable
ALTER TABLE "tool_inputs" ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
