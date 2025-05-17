import { InvitationStatus } from '../entities/invitation.entity';
import { Invitation } from '../entities/invitation.entity';

export class InvitationResponseDto {
  id!: string;
  email!: string;
  status!: InvitationStatus;
  created_at!: Date;
  updated_at!: Date;

  constructor(invitation: Invitation) {
    this.id = invitation.id;
    this.email = invitation.email;
    this.status = invitation.status;
    this.created_at = invitation.created_at;
    this.updated_at = invitation.updated_at;
  }
}
