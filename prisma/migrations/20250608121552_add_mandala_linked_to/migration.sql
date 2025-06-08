-- AlterTable
ALTER TABLE "Mandala" ADD COLUMN     "linkedToId" TEXT;

-- AddForeignKey
ALTER TABLE "Mandala" ADD CONSTRAINT "Mandala_linkedToId_fkey" FOREIGN KEY ("linkedToId") REFERENCES "Mandala"("id") ON DELETE SET NULL ON UPDATE CASCADE;
