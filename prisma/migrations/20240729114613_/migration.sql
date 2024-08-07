/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "specifications" ADD COLUMN     "version_id" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- AddForeignKey
ALTER TABLE "specifications" ADD CONSTRAINT "fk_version_id" FOREIGN KEY ("version_id") REFERENCES "version_history"("version_id") ON DELETE SET DEFAULT ON UPDATE SET DEFAULT;
