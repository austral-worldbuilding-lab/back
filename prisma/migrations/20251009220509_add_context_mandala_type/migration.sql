-- AlterEnum
ALTER TYPE "MandalaType" ADD VALUE 'CONTEXT';

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');
