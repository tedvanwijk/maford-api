-- DropForeignKey
ALTER TABLE "catalog_tools" DROP CONSTRAINT "fk_series_id";

-- AddForeignKey
ALTER TABLE "catalog_tools" ADD CONSTRAINT "fk_series_id" FOREIGN KEY ("series_id") REFERENCES "series"("series_id") ON DELETE CASCADE ON UPDATE CASCADE;
