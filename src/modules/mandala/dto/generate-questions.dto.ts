import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class GenerateQuestionsDto {
  @ApiProperty({
    description:
      'Array of dimensions to generate questions for. If not provided, uses all mandala dimensions.',
    example: ['ECOLOGIA', 'GOBIERNO', 'ECONOMIA'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @ApiProperty({
    description:
      'Array of scales to generate questions for. If not provided, uses all mandala scales.',
    example: ['CIUDAD', 'PROVINCIA', 'PAIS'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scales?: string[];

  @ApiProperty({
    description:
      'Lista opcional de nombres de archivos específicos a usar para el contexto de IA. Si no se proporciona, se usarán todos los archivos disponibles.',
    type: [String],
    required: false,
    example: [
      'entrevista_1.pdf',
      'encuesta_resultados.docx',
      'notas_investigacion.txt',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFiles?: string[];
}
