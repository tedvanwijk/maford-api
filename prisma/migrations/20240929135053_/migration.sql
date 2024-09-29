/*
  Warnings:

  - You are about to drop the column `a1` on the `center_types` table. All the data in the column will be lost.
  - You are about to drop the column `w_lower` on the `center_types` table. All the data in the column will be lost.
  - You are about to drop the column `w_upper` on the `center_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "center_types" DROP COLUMN "a1",
DROP COLUMN "w_lower",
DROP COLUMN "w_upper",
ADD COLUMN     "a1_lower" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "a1_upper" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "l_lower" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "l_upper" DOUBLE PRECISION NOT NULL DEFAULT 0;
