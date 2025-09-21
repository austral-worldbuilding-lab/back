-- CreateEnum
CREATE TYPE "ProjProvLinkRole" AS ENUM ('ORIGIN', 'GENERATED', 'REFERENCE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "parentProjectId" TEXT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateTable
CREATE TABLE "Provocation" (
    "id" TEXT NOT NULL,
    "parentProvocationId" TEXT,
    "question" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Provocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectProvocationLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provocationId" TEXT NOT NULL,
    "role" "ProjProvLinkRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectProvocationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Provocation_parentProvocationId_idx" ON "Provocation"("parentProvocationId");

-- CreateIndex
CREATE INDEX "ProjectProvocationLink_provocationId_role_idx" ON "ProjectProvocationLink"("provocationId", "role");

-- CreateIndex
CREATE INDEX "ProjectProvocationLink_projectId_role_idx" ON "ProjectProvocationLink"("projectId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProvocationLink_projectId_provocationId_role_key" ON "ProjectProvocationLink"("projectId", "provocationId", "role");

-- CreateIndex
CREATE INDEX "Project_parentProjectId_idx" ON "Project"("parentProjectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_parentProjectId_fkey" FOREIGN KEY ("parentProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provocation" ADD CONSTRAINT "Provocation_parentProvocationId_fkey" FOREIGN KEY ("parentProvocationId") REFERENCES "Provocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProvocationLink" ADD CONSTRAINT "ProjectProvocationLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProvocationLink" ADD CONSTRAINT "ProjectProvocationLink_provocationId_fkey" FOREIGN KEY ("provocationId") REFERENCES "Provocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
