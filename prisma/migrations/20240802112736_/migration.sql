-- AlterTable
ALTER TABLE "specifications" ADD COLUMN     "tool_id" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "specifications" ADD CONSTRAINT "fK_tool_id" FOREIGN KEY ("tool_id") REFERENCES "tools"("tool_id") ON DELETE CASCADE ON UPDATE CASCADE;
