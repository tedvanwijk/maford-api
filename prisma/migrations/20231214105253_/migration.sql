/*
  Warnings:

  - You are about to drop the column `category` on the `tool_inputs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `tools` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tool_input_category_id` to the `tool_inputs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tool_inputs" DROP COLUMN "category",
ADD COLUMN     "tool_input_category_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "tool_input_categories" (
    "tool_input_category_id" SERIAL NOT NULL,
    "tool_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "display_title" TEXT NOT NULL,

    CONSTRAINT "tool_input_categories_pkey" PRIMARY KEY ("tool_input_category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tools_name_key" ON "tools"("name");

-- AddForeignKey
ALTER TABLE "tool_inputs" ADD CONSTRAINT "fk_tool_input_category_id" FOREIGN KEY ("tool_input_category_id") REFERENCES "tool_input_categories"("tool_input_category_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tool_input_categories" ADD CONSTRAINT "fk_tool_id" FOREIGN KEY ("tool_id") REFERENCES "tools"("tool_id") ON DELETE CASCADE ON UPDATE NO ACTION;
