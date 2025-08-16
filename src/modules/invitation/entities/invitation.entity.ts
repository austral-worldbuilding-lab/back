import { InvitationStatus } from '@prisma/client';

export class Invitation {
  id!: string;
  email!: string;
  token!: string;
  status!: InvitationStatus;
  expiresAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
  projectId!: string;
  invitedById!: string;
  roleId?: string | null;
  role?: {
    id: string;
    name: string;
  };
}
