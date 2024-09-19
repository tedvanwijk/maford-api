-- CreateTable
CREATE TABLE "default_input_values" (
    "default_input_value_id" SERIAL NOT NULL,
    "tool_input_id" INTEGER NOT NULL,
    "catalog" BOOLEAN NOT NULL,

    CONSTRAINT "default_input_values_pkey" PRIMARY KEY ("default_input_value_id")
);

-- AddForeignKey
ALTER TABLE "default_input_values" ADD CONSTRAINT "fk_tool_input_id" FOREIGN KEY ("tool_input_id") REFERENCES "tool_inputs"("tool_input_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
