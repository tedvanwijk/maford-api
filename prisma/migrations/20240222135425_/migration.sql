/*
  Warnings:

  - You are about to drop the column `message` on the `reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reports" DROP COLUMN "message",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "summary" TEXT;
