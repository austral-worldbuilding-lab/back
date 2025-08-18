/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
