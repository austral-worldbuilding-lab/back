import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AiSolutionResponseDto {
  @ApiProperty({
    description: 'Título de la solución generada',
    example: 'Crear un Festejódromo',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Descripción detallada de la solución',
    example:
      'Se propone la creación de un espacio dedicado dentro del campus universitario para la celebración de festejos de graduación. Este "Festejódromo" contaría con una infraestructura específica que facilitaría la limpieza inmediata, promovería la donación de alimentos sobrantes para fomentar festejos solidarios y sostenibles, y ofrecería mensajes inspiradores sobre una nueva etapa para los graduados.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Pregunta provocativa relacionada con la solución',
    example:
      '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
  })
  @IsString()
  @IsNotEmpty()
  provocation!: string;
}
