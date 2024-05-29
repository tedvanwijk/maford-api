-- CreateTable
CREATE TABLE "series_inputs" (
    "series_input_id" SERIAL NOT NULL,
    "series_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "property_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "series_inputs_pkey" PRIMARY KEY ("series_input_id")
);

-- AddForeignKey
ALTER TABLE "series_inputs" ADD CONSTRAINT "fk_series_id" FOREIGN KEY ("series_id") REFERENCES "series"("series_id") ON DELETE CASCADE ON UPDATE NO ACTION;
