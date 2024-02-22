/*
  Warnings:

  - You are about to drop the column `categories` on the `tools` table. All the data in the column will be lost.
  - You are about to drop the column `inputs` on the `tools` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tools" DROP COLUMN "categories",
DROP COLUMN "inputs";
