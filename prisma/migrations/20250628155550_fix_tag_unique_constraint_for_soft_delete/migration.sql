/*
  Warnings:

  - A unique constraint covering the columns `[name,projectId,isActive]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Tag_name_projectId_key";

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_projectId_isActive_key" ON "Tag"("name", "projectId", "isActive");
