import { InvitationStatus } from '@prisma/client';

export class OrganizationInvitation {
  id!: string;
  email!: string | null;
  token!: string;
  inviteToken?: string | null;
  status!: InvitationStatus;
  expiresAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  organizationId!: string;
  invitedById!: string;

  roleId?: string | null;
  role?: {
    id: string;
    name: string;
  } | null;
}
