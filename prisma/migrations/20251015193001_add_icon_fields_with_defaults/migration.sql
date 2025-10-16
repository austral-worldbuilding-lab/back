-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'building-2';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'folder';

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');
