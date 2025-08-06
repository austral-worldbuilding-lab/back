import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class InvitationDto {
  @ApiProperty({
    description: 'ID único de la invitación',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario invitado',
    example: 'usuario@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Estado actual de la invitación',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  @IsEnum(InvitationStatus)
  @IsNotEmpty()
  status!: InvitationStatus;

  @ApiProperty({
    description: 'ID del proyecto al que se invita',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;
}
