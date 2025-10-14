-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateTable
CREATE TABLE "gemini_file_cache" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "contextPath" TEXT NOT NULL,
    "geminiFileId" TEXT NOT NULL,
    "geminiUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gemini_file_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gemini_file_cache_expiresAt_idx" ON "gemini_file_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "gemini_file_cache_contextPath_fileName_key" ON "gemini_file_cache"("contextPath", "fileName");
