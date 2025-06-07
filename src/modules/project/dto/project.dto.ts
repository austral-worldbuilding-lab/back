import { ApiProperty } from '@nestjs/swagger';
import { Dimension } from '@modules/project/types/dimension.type';

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
      {
        id: '1',
        name: 'Recursos',
        color: '#FF0000',
        projectId: '1',
        mandalaId: null,
      },
      {
        id: '2',
        name: 'Cultura',
        color: '#00FF00',
        projectId: '1',
        mandalaId: null,
      },
      {
        id: '3',
        name: 'Infraestructura',
        color: '#0000FF',
        projectId: '1',
        mandalaId: null,
      },
      {
        id: '4',
        name: 'Economía',
        color: '#FFFF00',
        projectId: '1',
        mandalaId: null,
      },
      {
        id: '5',
        name: 'Gobierno',
        color: '#FF00FF',
        projectId: '1',
        mandalaId: null,
      },
      {
        id: '6',
        name: 'Ecología',
        color: '#00FFFF',
        projectId: '1',
        mandalaId: null,
      },
    ],
  })
  dimensions!: Dimension[];

  @ApiProperty({
    description: 'Escalas del proyecto',
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  scales!: string[];

  @ApiProperty({
    description: 'Fecha de creación del proyecto',
  })
  createdAt!: Date;
}
