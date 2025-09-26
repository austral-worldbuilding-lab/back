import { ApiProperty } from '@nestjs/swagger';

export class OrganizationUserRoleResponseDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: 'firebase-user-id',
  })
  userId!: string;

  @ApiProperty({
    description: 'ID de la organización',
    example: 'uuid-organization-id',
  })
  organizationId!: string;

  @ApiProperty({
    description: 'Nuevo rol asignado al usuario',
    example: 'admin',
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
