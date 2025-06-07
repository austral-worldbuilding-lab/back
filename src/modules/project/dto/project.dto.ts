import { ApiProperty } from '@nestjs/swagger';
import { ProjectConfiguration } from '@modules/project/types/project-configuration.type';

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
    description: 'Configuración del proyecto',
    example: {
      dimensions: [
        { name: 'Recursos', color: '#FF0000' },
        { name: 'Cultura', color: '#00FF00' },
        { name: 'Infraestructura', color: '#0000FF' },
        { name: 'Economía', color: '#FFFF00' },
        { name: 'Gobierno', color: '#FF00FF' },
        { name: 'Ecología', color: '#00FFFF' },
      ],
      scales: ['Persona', 'Comunidad', 'Institución'],
    },
  })
  configuration!: ProjectConfiguration;

  @ApiProperty({
    description: 'Fecha de creación del proyecto',
  })
  createdAt!: Date;
}
