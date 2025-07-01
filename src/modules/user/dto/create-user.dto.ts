import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ID único del usuario',
  })
  @IsNotEmpty()
  firebaseUid!: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
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
    default: true,
  })
  @IsBoolean()
  is_active?: boolean = true;
}
