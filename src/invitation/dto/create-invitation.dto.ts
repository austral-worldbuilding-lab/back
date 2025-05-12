import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsNotEmpty()
  invitedById: string;

  constructor(email: string, projectId: string, invitedById: string) {
    this.email = email;
    this.projectId = projectId;
    this.invitedById = invitedById;
  }
}
