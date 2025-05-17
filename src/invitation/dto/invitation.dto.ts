import { InvitationStatus } from '@prisma/client';

export class InvitationDto {
  id!: string;
  email!: string;
  status!: InvitationStatus;
  projectId!: string;
}
