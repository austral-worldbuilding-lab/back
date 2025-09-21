import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProvocationDto {
  @ApiProperty({
    description: 'Título de la provocación',
    example: 'Crear un Festejódromo',
  })
  @IsString()
  title?: string;
  @ApiProperty({
    description: 'Descripción de la provocación',
    example:
      'Se propone la creación de un espacio dedicado dentro del campus universitario para la celebración de festejos de graduación. Este "Festejódromo" contaría con una infraestructura específica que facilitaría la limpieza inmediata, promovería la donación de alimentos sobrantes para fomentar festejos solidarios y sostenibles, y ofrecería mensajes inspiradores sobre una nueva etapa para los graduados.',
  })
  @IsString()
  description?: string;
  @ApiProperty({
    description: 'Provocación en forma de pregunta',
    example:
      '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
  })
  @IsString()
  @IsNotEmpty()
  question!: string;
}
