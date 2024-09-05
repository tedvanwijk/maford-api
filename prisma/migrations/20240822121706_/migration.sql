-- AlterTable
ALTER TABLE "series_inputs" ADD COLUMN     "catalog_index" INTEGER;

-- CreateTable
CREATE TABLE "catalog_tools" (
    "catalog_tool_id" SERIAL NOT NULL,
    "tool_number" TEXT NOT NULL,
    "series_id" INTEGER NOT NULL,
    "data" TEXT[],

    CONSTRAINT "catalog_tools_pkey" PRIMARY KEY ("catalog_tool_id")
);

-- AddForeignKey
ALTER TABLE "catalog_tools" ADD CONSTRAINT "fk_series_id" FOREIGN KEY ("series_id") REFERENCES "series"("series_id") ON DELETE CASCADE ON UPDATE NO ACTION;
