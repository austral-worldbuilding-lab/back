import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

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
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Token único de la invitación',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'Estado actual de la invitación',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  @IsEnum(InvitationStatus)
  @IsNotEmpty()
  status!: InvitationStatus;

  @ApiProperty({
    description: 'Fecha de expiración de la invitación',
    example: '2024-08-23T17:40:08.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  expiresAt!: Date;

  @ApiProperty({
    description: 'ID del proyecto al que se invita',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Rol que tendrá el usuario invitado en el proyecto',
    example: 'worldbuilder',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description: 'Token único para links de invitación compartibles',
    example: 'abc123def456',
    required: false,
  })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
