-- AlterTable
ALTER TABLE "AiUsage" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "AiUsage_projectId_timestamp_idx" ON "AiUsage"("projectId", "timestamp");

-- CreateIndex
CREATE INDEX "AiUsage_organizationId_timestamp_idx" ON "AiUsage"("organizationId", "timestamp");

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
