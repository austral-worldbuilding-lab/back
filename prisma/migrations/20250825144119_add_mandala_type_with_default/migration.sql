-- CreateEnum
CREATE TYPE "MandalaType" AS ENUM ('CHARACTER', 'OVERLAP');

-- AlterTable
ALTER TABLE "Mandala" ADD COLUMN "type" "MandalaType" NOT NULL DEFAULT 'CHARACTER';

-- Update existing mandalas to have a default type
-- This ensures all existing mandalas get a valid type value
UPDATE "Mandala" SET "type" = 'CHARACTER' WHERE "type" IS NULL;
