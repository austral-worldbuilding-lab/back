import { IsNotEmpty, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
  })
  @IsNotEmpty()
  first_name!: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  @IsNotEmpty()
  last_name!: string;

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
