import { ApiProperty } from '@nestjs/swagger';

export class ProjectUserDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: 'firebase-user-id',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
  username!: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Rol del usuario en el proyecto',
    example: 'admin',
  })
  role!: string;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
  })
  isActive!: boolean;
} 