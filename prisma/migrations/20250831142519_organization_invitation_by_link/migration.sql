/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteToken]` on the table `OrganizationInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "inviteToken" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationInvitation" ADD COLUMN     "inviteToken" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "color" SET DEFAULT '#' || lpad(to_hex((random() * 16777215)::int), 6, '0');

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_inviteToken_key" ON "Invitation"("inviteToken");

-- CreateIndex
CREATE INDEX "Invitation_inviteToken_idx" ON "Invitation"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_inviteToken_key" ON "OrganizationInvitation"("inviteToken");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_inviteToken_idx" ON "OrganizationInvitation"("inviteToken");
