import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'ID del usuario que realiza la invitación',
  })
  @IsUUID()
  @IsNotEmpty()
  invitedById!: string;
}
