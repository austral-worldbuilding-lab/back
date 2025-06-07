import { ApiProperty } from '@nestjs/swagger';
import { Dimension } from '@modules/project/types/dimension.type';

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
      {
        id: '1',
        name: 'Recursos',
        color: '#FF0000',
        projectId: null,
        mandalaId: '1',
      },
      {
        id: '2',
        name: 'Cultura',
        color: '#00FF00',
        projectId: null,
        mandalaId: '1',
      },
      {
        id: '3',
        name: 'Infraestructura',
        color: '#0000FF',
        projectId: null,
        mandalaId: '1',
      },
      {
        id: '4',
        name: 'Economía',
        color: '#FFFF00',
        projectId: null,
        mandalaId: '1',
      },
      {
        id: '5',
        name: 'Gobierno',
        color: '#FF00FF',
        projectId: null,
        mandalaId: '1',
      },
      {
        id: '6',
        name: 'Ecología',
        color: '#00FFFF',
        projectId: null,
        mandalaId: '1',
      },
    ],
  })
  dimensions!: Dimension[];

  @ApiProperty({
    description: 'Escalas del mandala',
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  scales!: string[];

  @ApiProperty({
    description: 'Fecha de creación del mandala',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del mandala',
  })
  updatedAt!: Date;
}
