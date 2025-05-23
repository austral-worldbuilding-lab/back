import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'ID único del usuario'
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
  username!: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
  })
  first_name!: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  last_name!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
  })
  is_active!: boolean;
}
