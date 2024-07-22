/*
  Warnings:

  - You are about to drop the column `options` on the `series_inputs` table. All the data in the column will be lost.
  - Made the column `property_name` on table `tool_inputs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "series_inputs" DROP COLUMN "options",
ALTER COLUMN "property_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tool_inputs" ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "property_name" SET NOT NULL;
