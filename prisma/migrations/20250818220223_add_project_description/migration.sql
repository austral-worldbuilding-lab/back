/*
  Safe migration that handles existing data and enum values
*/

-- Add enum value only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'InvitationStatus' AND e.enumlabel = 'EXPIRED'
  ) THEN
    ALTER TYPE "InvitationStatus" ADD VALUE 'EXPIRED';
  END IF;
END$$;

-- Add columns as nullable first
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "roleId" TEXT;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "token" TEXT;

-- Backfill existing rows
UPDATE "Invitation" 
SET 
  "expiresAt" = COALESCE("expiresAt", "createdAt" + interval '7 days'),
  "token" = COALESCE("token", md5(random()::text || clock_timestamp()::text))
WHERE "expiresAt" IS NULL OR "token" IS NULL;

-- Now make required columns NOT NULL
ALTER TABLE "Invitation" 
  ALTER COLUMN "expiresAt" SET NOT NULL,
  ALTER COLUMN "token" SET NOT NULL;

-- Add Project description
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Update Tag color default
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- Create unique index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Invitation_token_key') THEN
    CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
  END IF;
END$$;

-- Add foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name='Invitation' AND constraint_name='Invitation_roleId_fkey'
  ) THEN
    ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_roleId_fkey" 
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
