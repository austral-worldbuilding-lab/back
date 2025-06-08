import { ApiProperty } from '@nestjs/swagger';
import { MandalaConfiguration } from '../types/mandala-configuration.type';
import { CenterDto } from '@common/dto/center.dto';

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
    description: 'Centro del mandala',
    example: {
      name: 'Estudiante',
      description: 'Alumno de 23 años que estudia en la universidad',
      color: '#3B82F6',
    },
  })
  center!: CenterDto;

  @ApiProperty({
    description: 'Configuración del mandala',
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
  configuration!: MandalaConfiguration;

  @ApiProperty({
    description: 'ID de la mandala al que está vinculado (padre)',
    required: false,
  })
  linkedToId: string | null = null;

  @ApiProperty({
    description: 'Fecha de creación del mandala',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del mandala',
  })
  updatedAt!: Date;
}
