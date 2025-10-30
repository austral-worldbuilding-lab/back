-- Add level column to Role table
ALTER TABLE "Role" ADD COLUMN "level" INTEGER;

-- Set levels for existing roles based on hierarchy (lower = higher privilege)
UPDATE "Role" SET "level" = 1 WHERE name = 'dueño';
UPDATE "Role" SET "level" = 2 WHERE name = 'facilitador';
UPDATE "Role" SET "level" = 3 WHERE name = 'worldbuilder';
UPDATE "Role" SET "level" = 4 WHERE name = 'lector';

-- Make level required and unique
ALTER TABLE "Role" ALTER COLUMN "level" SET NOT NULL;
CREATE UNIQUE INDEX "Role_level_key" ON "Role"("level");
