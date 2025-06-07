import { ApiProperty } from '@nestjs/swagger';

export class MandalaDto {
  @ApiProperty({
    description: 'ID único del mandala',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  name!: string;

  @ApiProperty({
    description: 'ID del proyecto al que pertenece el mandala',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Dimensiones del mandala',
    example: [
      'Recursos',
      'Cultura',
      'Infraestructura',
      'Economía',
      'Gobierno',
      'Ecología',
    ],
  })
  dimensions!: string[];

  @ApiProperty({
    description: 'Escalas del mandala',
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  scales!: string[];
}
