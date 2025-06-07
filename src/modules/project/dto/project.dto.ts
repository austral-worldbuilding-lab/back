import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({
    description: 'ID único del proyecto',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Proyecto Comedor Austral',
  })
  name!: string;

  @ApiProperty({
    description: 'Dimensiones del proyecto',
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
    description: 'Escalas del proyecto',
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  scales!: string[];
}
