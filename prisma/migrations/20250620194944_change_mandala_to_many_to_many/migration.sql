/*
  Warnings:

  - You are about to drop the column `linkedToId` on the `Mandala` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Mandala" DROP CONSTRAINT "Mandala_linkedToId_fkey";

-- AlterTable
ALTER TABLE "Mandala" DROP COLUMN "linkedToId";

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateTable
CREATE TABLE "_MandalaRelations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MandalaRelations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MandalaRelations_B_index" ON "_MandalaRelations"("B");

-- AddForeignKey
ALTER TABLE "_MandalaRelations" ADD CONSTRAINT "_MandalaRelations_A_fkey" FOREIGN KEY ("A") REFERENCES "Mandala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MandalaRelations" ADD CONSTRAINT "_MandalaRelations_B_fkey" FOREIGN KEY ("B") REFERENCES "Mandala"("id") ON DELETE CASCADE ON UPDATE CASCADE;
