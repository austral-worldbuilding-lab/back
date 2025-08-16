import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario invitado',
    example: 'usuario@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'ID del proyecto al que se invita',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Rol que tendrá el usuario invitado en el proyecto',
    example: 'member',
    examples: {
      owner: { value: 'owner', description: 'Propietario del proyecto' },
      admin: { value: 'admin', description: 'Administrador del proyecto' },
      member: { value: 'member', description: 'Miembro del proyecto' },
      viewer: { value: 'viewer', description: 'Solo lectura' },
    },
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;
}
