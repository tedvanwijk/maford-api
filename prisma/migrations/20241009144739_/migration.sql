/*
  Warnings:

  - A unique constraint covering the columns `[property_name,tool_id]` on the table `tool_inputs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tool_inputs_property_name_tool_id_key" ON "tool_inputs"("property_name", "tool_id");
