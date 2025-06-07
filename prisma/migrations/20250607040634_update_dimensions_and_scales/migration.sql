/*
  Warnings:

  - The `dimensions` column on the `Mandala` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dimensions` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Mandala" DROP COLUMN "dimensions",
ADD COLUMN     "dimensions" JSONB[];

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "dimensions",
ADD COLUMN     "dimensions" JSONB[],
ALTER COLUMN "scales" DROP DEFAULT;
