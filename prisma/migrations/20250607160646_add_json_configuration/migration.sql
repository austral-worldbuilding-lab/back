/*
  Warnings:

  - Added the required column `configuration` to the `Mandala` table without a default value. This is not possible if the table is not empty.
  - Added the required column `configuration` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mandala" ADD COLUMN     "configuration" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "configuration" JSONB NOT NULL;
