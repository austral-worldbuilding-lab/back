/*
  Warnings:

  - You are about to drop the column `dimensions` on the `Mandala` table. All the data in the column will be lost.
  - You are about to drop the column `dimensions` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mandala" DROP COLUMN "dimensions";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "dimensions";

-- CreateTable
CREATE TABLE "Dimension" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "projectId" TEXT,
    "mandalaId" TEXT,

    CONSTRAINT "Dimension_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dimension" ADD CONSTRAINT "Dimension_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dimension" ADD CONSTRAINT "Dimension_mandalaId_fkey" FOREIGN KEY ("mandalaId") REFERENCES "Mandala"("id") ON DELETE CASCADE ON UPDATE CASCADE;
