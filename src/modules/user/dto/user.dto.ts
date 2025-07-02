import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  @IsBoolean()
  is_active!: boolean;
}
