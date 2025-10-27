import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrganizationInvitationDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario invitado',
    example: 'usuario@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'ID de la organización a la que se invita',
    example: '8f3a7d9e-1c2b-4a5e-9f8a-7d6c5b4a3e2f',
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description:
      'Rol que tendrá el usuario invitado en la organización (opcional)',
    example: 'worldbuilder',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description:
      'Fecha de expiración de la invitación en formato ISO 8601 (opcional)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
