/*
  Warnings:

  - You are about to drop the `_MandalaRelations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MandalaRelations" DROP CONSTRAINT "_MandalaRelations_A_fkey";

-- DropForeignKey
ALTER TABLE "_MandalaRelations" DROP CONSTRAINT "_MandalaRelations_B_fkey";

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- DropTable
DROP TABLE "_MandalaRelations";

-- CreateTable
CREATE TABLE "_MandalaToMandala" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MandalaToMandala_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MandalaToMandala_B_index" ON "_MandalaToMandala"("B");

-- AddForeignKey
ALTER TABLE "_MandalaToMandala" ADD CONSTRAINT "_MandalaToMandala_A_fkey" FOREIGN KEY ("A") REFERENCES "Mandala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MandalaToMandala" ADD CONSTRAINT "_MandalaToMandala_B_fkey" FOREIGN KEY ("B") REFERENCES "Mandala"("id") ON DELETE CASCADE ON UPDATE CASCADE;
