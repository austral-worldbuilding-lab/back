import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

// TODO: use generics for selectedFiles as its the same as the one in generate-questions.dto.ts
export class GenerateSolutionsDto {
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
