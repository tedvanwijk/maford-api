/*
  Warnings:

  - Made the column `tool_id` on table `tool_input_categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tool_id` on table `tool_inputs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tool_input_categories" ALTER COLUMN "tool_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "tool_inputs" ALTER COLUMN "tool_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "tool_inputs_common" (
    "tool_input_id" SERIAL NOT NULL,
    "client_name" TEXT NOT NULL,
    "property_name" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group" INTEGER,
    "order" INTEGER,

    CONSTRAINT "tool_inputs_common_pkey" PRIMARY KEY ("tool_input_id")
);

-- CreateTable
CREATE TABLE "tool_input_common_options" (
    "tool_input_option_id" SERIAL NOT NULL,
    "tool_input_id" INTEGER NOT NULL,

    CONSTRAINT "tool_input_common_options_pkey" PRIMARY KEY ("tool_input_option_id")
);

-- AddForeignKey
ALTER TABLE "tool_input_common_options" ADD CONSTRAINT "fk_tool_input_id" FOREIGN KEY ("tool_input_id") REFERENCES "tool_inputs_common"("tool_input_id") ON DELETE CASCADE ON UPDATE NO ACTION;
