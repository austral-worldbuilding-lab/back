-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "rootProjectId" TEXT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateIndex
CREATE INDEX "Project_rootProjectId_idx" ON "Project"("rootProjectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_rootProjectId_fkey" FOREIGN KEY ("rootProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
