import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProvocationDto {
  @ApiProperty({
    description: 'ID único de la provocación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Título de la provocación',
    example: 'Crear un Festejódromo',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la provocación',
    example:
      'Se propone la creación de un espacio dedicado dentro del campus universitario para la celebración de festejos de graduación...',
  })
  description?: string;

  @ApiProperty({
    description: 'Pregunta o provocación principal',
    example:
      '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
  })
  question!: string;

  @ApiPropertyOptional({
    description: 'ID de la provocación padre (si es una sub-provocación)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  parentProvocationId?: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Indica si la provocación está activa',
    example: true,
  })
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de eliminación (soft delete)',
    example: null,
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Provocaciones hijas (sub-provocaciones)',
    type: [ProvocationDto],
  })
  children?: ProvocationDto[];

  @ApiPropertyOptional({
    description: 'Provocación padre',
    type: ProvocationDto,
  })
  parent?: ProvocationDto;

  @ApiPropertyOptional({
    description: 'Proyectos relacionados con esta provocación',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        role: 'ORIGIN',
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    ],
  })
  projects?: {
    id: string;
    projectId: string;
    role: 'ORIGIN' | 'GENERATED' | 'REFERENCE';
    createdAt: Date;
    project?: {
      id: string;
      name: string;
    };
  }[];
}
