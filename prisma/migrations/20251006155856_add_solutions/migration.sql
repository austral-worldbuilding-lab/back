-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ProjSolLinkRole" AS ENUM ('GENERATED', 'REFERENCE');

-- AlterEnum
ALTER TYPE "AiService" ADD VALUE 'GENERATE_ENCYCLOPEDIA';

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- RenameTable (preserves data)
ALTER TABLE "ProjectProvocationLink" RENAME TO "ProjProvLink";

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "impactLevel" "ImpactLevel",
    "impactDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjSolLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "role" "ProjSolLinkRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjSolLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolProvLink" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "provocationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolProvLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjSolLink_solutionId_role_idx" ON "ProjSolLink"("solutionId", "role");

-- CreateIndex
CREATE INDEX "ProjSolLink_projectId_role_idx" ON "ProjSolLink"("projectId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ProjSolLink_projectId_solutionId_role_key" ON "ProjSolLink"("projectId", "solutionId", "role");

-- CreateIndex
CREATE INDEX "SolProvLink_solutionId_idx" ON "SolProvLink"("solutionId");

-- CreateIndex
CREATE INDEX "SolProvLink_provocationId_idx" ON "SolProvLink"("provocationId");

-- CreateIndex
CREATE UNIQUE INDEX "SolProvLink_solutionId_provocationId_key" ON "SolProvLink"("solutionId", "provocationId");

-- Rename constraints for ProjProvLink
ALTER TABLE "ProjProvLink" RENAME CONSTRAINT "ProjectProvocationLink_pkey" TO "ProjProvLink_pkey";
ALTER TABLE "ProjProvLink" RENAME CONSTRAINT "ProjectProvocationLink_projectId_fkey" TO "ProjProvLink_projectId_fkey";
ALTER TABLE "ProjProvLink" RENAME CONSTRAINT "ProjectProvocationLink_provocationId_fkey" TO "ProjProvLink_provocationId_fkey";

-- Rename indexes for ProjProvLink
ALTER INDEX "ProjectProvocationLink_provocationId_role_idx" RENAME TO "ProjProvLink_provocationId_role_idx";
ALTER INDEX "ProjectProvocationLink_projectId_role_idx" RENAME TO "ProjProvLink_projectId_role_idx";
ALTER INDEX "ProjectProvocationLink_projectId_provocationId_role_key" RENAME TO "ProjProvLink_projectId_provocationId_role_key";

-- AddForeignKey
ALTER TABLE "ProjSolLink" ADD CONSTRAINT "ProjSolLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjSolLink" ADD CONSTRAINT "ProjSolLink_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolProvLink" ADD CONSTRAINT "SolProvLink_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolProvLink" ADD CONSTRAINT "SolProvLink_provocationId_fkey" FOREIGN KEY ("provocationId") REFERENCES "Provocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
