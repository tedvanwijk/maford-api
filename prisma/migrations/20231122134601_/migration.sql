/*
  Warnings:

  - You are about to drop the column `tolerance_file_input_range` on the `series` table. All the data in the column will be lost.
  - You are about to drop the column `tolerance_file_inputs` on the `series` table. All the data in the column will be lost.
  - You are about to drop the column `tolerance_file_name` on the `series` table. All the data in the column will be lost.
  - You are about to drop the column `tolerance_file_output_range` on the `series` table. All the data in the column will be lost.
  - Added the required column `tool_series_file_name` to the `series` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tool_series_input_range` to the `series` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tool_series_output_range` to the `series` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "series" DROP COLUMN "tolerance_file_input_range",
DROP COLUMN "tolerance_file_inputs",
DROP COLUMN "tolerance_file_name",
DROP COLUMN "tolerance_file_output_range",
ADD COLUMN     "tool_series_file_name" TEXT NOT NULL,
ADD COLUMN     "tool_series_input_range" TEXT NOT NULL,
ADD COLUMN     "tool_series_inputs" TEXT[],
ADD COLUMN     "tool_series_output_range" TEXT NOT NULL;
