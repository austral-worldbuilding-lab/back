-- CreateEnum
CREATE TYPE "AiService" AS ENUM ('GENERATE_POSTITS', 'GENERATE_QUESTIONS', 'GENERATE_SUMMARY');

-- CreateEnum
CREATE TYPE "AiModel" AS ENUM ('GEMINI_25_FLASH');

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" "AiService" NOT NULL,
    "model" "AiModel" NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsage_userId_timestamp_idx" ON "AiUsage"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AiUsage_service_timestamp_idx" ON "AiUsage"("service", "timestamp");

-- CreateIndex
CREATE INDEX "AiUsage_model_timestamp_idx" ON "AiUsage"("model", "timestamp");
