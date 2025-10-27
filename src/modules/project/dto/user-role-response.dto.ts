import { ApiProperty } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: 'firebase-user-id',
  })
  userId!: string;

  @ApiProperty({
    description: 'ID del proyecto',
    example: 'uuid-project-id',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Nuevo rol asignado al usuario',
    example: 'facilitador',
  })
  role!: string;

  @ApiProperty({
    description: 'Información del usuario',
    type: 'object',
    properties: {
      id: { type: 'string' },
      username: { type: 'string' },
      email: { type: 'string' },
    },
  })
  user!: {
    id: string;
    username: string;
    email: string;
  };
}
