/*
  Warnings:

  - A unique constraint covering the columns `[contextPath,fileName]` on the table `file_selections` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contextPath` to the `file_selections` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "file_selections_orgId_fileName_key";

-- DropIndex
DROP INDEX "file_selections_orgId_projectId_fileName_key";

-- DropIndex
DROP INDEX "file_selections_orgId_projectId_mandalaId_fileName_key";

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- AlterTable
ALTER TABLE "file_selections" ADD COLUMN     "contextPath" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "file_selections_orgId_idx" ON "file_selections"("orgId");

-- CreateIndex
CREATE INDEX "file_selections_orgId_projectId_idx" ON "file_selections"("orgId", "projectId");

-- CreateIndex
CREATE INDEX "file_selections_orgId_projectId_mandalaId_idx" ON "file_selections"("orgId", "projectId", "mandalaId");

-- CreateIndex
CREATE INDEX "file_selections_contextPath_idx" ON "file_selections"("contextPath");

-- CreateIndex
CREATE UNIQUE INDEX "file_selections_contextPath_fileName_key" ON "file_selections"("contextPath", "fileName");
