import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';

export class InvitationDto {
  @ApiProperty({
    description: 'ID único de la invitación',
  })
  id!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario invitado',
    example: 'usuario@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Estado actual de la invitación',
    enum: InvitationStatus,
    example: 'PENDING',
  })
  status!: InvitationStatus;

  @ApiProperty({
    description: 'ID del proyecto al que se invita',
  })
  projectId!: string;
}
