import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class GeneratePostitsDto {
  @ApiProperty({
    description:
      'Array of dimensions to generate postits for. If not provided, uses all mandala dimensions.',
    example: ['ECOLOGÍA', 'GOBIERNO', 'ECONOMÍA'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @ApiProperty({
    description:
      'Array of scales to generate postits for. If not provided, uses all mandala scales.',
    example: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
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

  @ApiProperty({
    description:
      'Si es true, omite el cache y genera post-its nuevos. Por defecto es false.',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipCache?: boolean;
}
