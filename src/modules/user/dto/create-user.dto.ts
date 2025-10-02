import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsBoolean, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ID único del usuario de Firebase',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
  })
  @IsString()
  @IsNotEmpty()
  firebaseUid!: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

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
