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

export class OrganizationInvitationDto {
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
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  expiresAt!: Date;

  @ApiProperty({
    description: 'ID de la organización a la que se invita',
    example: '44f1f4a0-2a21-4b6d-bc85-9b2d9b2d1f0e',
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description: 'Rol que tendrá el usuario invitado en la organización',
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
