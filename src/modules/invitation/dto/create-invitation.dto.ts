import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID, IsOptional, IsIn } from 'class-validator';

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
    enum: ['owner', 'admin', 'member', 'viewer'],
    required: false,
  })
  @IsOptional()
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role?: string;
}
