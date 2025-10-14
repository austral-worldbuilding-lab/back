/*
  Warnings:

  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AiService" ADD VALUE 'GENERATE_PROVOCATIONS';

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;
UPDATE "User" SET "fullName" = "email";
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;