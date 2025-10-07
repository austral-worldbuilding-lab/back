import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImpactDto {
  @ApiProperty({
    description: 'Impact level',
    example: 'high',
    enum: ['low', 'medium', 'high'],
  })
  level!: 'low' | 'medium' | 'high';

  @ApiProperty({
    description: 'Impact description',
    example: 'Reduce un 40% los residuos no reciclados.',
  })
  description!: string;
}

export class SolutionDto {
  @ApiProperty({
    description: 'Solution ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Solution title',
    example: 'Sistema de Reciclaje Comunitario',
  })
  title!: string;

  @ApiProperty({
    description: 'Solution description',
    example:
      'Implementación de puntos de reciclaje inteligentes con incentivos vecinales.',
  })
  description!: string;

  @ApiProperty({
    description: 'Problem being solved',
    example: 'Alta generación de residuos no clasificados en zonas urbanas.',
  })
  problem!: string;

  @ApiPropertyOptional({
    description: 'Impact of the solution',
    type: ImpactDto,
  })
  impact?: ImpactDto;

  @ApiProperty({
    description: 'Related provocations',
    example: ['¿Qué pasa si los ciudadanos obtienen beneficios por reciclar?'],
    type: [String],
  })
  provocations!: string[];

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Deletion date (soft delete)',
    example: '2024-01-15T10:30:00.000Z',
  })
  deletedAt?: Date | null;
}
