import { ApiProperty } from '@nestjs/swagger';

export class OrganizationDto {
  @ApiProperty({ description: 'ID de la organización' })
  id!: string;

  @ApiProperty({ description: 'Nombre de la organización' })
  name!: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Tipo de acceso del usuario a la organización',
    enum: ['full', 'limited'],
    example: 'full',
    required: false,
  })
  accessType?: 'full' | 'limited';

  @ApiProperty({
    description: 'Imagen de perfil de la organización',
    example:
      'https://account.blob.core.windows.net/container/org/123/images/uuid.jpg',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Imagen de banner de la organización',
    example:
      'https://account.blob.core.windows.net/container/org/123/images/uuid.jpg',
    required: false,
  })
  bannerUrl?: string;
}
