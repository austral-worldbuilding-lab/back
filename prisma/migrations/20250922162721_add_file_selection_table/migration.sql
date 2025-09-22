-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateTable
CREATE TABLE "file_selections" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "projectId" TEXT,
    "mandalaId" TEXT,
    "fileName" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_selections_orgId_fileName_key" ON "file_selections"("orgId", "fileName");

-- CreateIndex
CREATE UNIQUE INDEX "file_selections_orgId_projectId_fileName_key" ON "file_selections"("orgId", "projectId", "fileName");

-- CreateIndex
CREATE UNIQUE INDEX "file_selections_orgId_projectId_mandalaId_fileName_key" ON "file_selections"("orgId", "projectId", "mandalaId", "fileName");
