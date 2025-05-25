import { InvitationStatus } from '@prisma/client';

export class Invitation {
  id!: string;
  email!: string;
  status!: InvitationStatus;
  createdAt!: Date;
  updatedAt!: Date;
  projectId!: string;
  invitedById!: string;
}
