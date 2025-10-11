import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  ArrayMinSize,
  ValidateNested,
  IsHexColor,
  IsEnum,
} from 'class-validator';

import { MandalaType } from '../types/mandala-type.enum';

// This DTO is used to create the mandala center of the characters inside an overlap mandala (personaje de origen que fue usado para crear la mandala unificada)
export class CreateMandalaCenterWithOriginDto {
  @ApiProperty({
    description: 'ID del mandala de origen',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'Nombre del personaje de origen',
    example: 'Estudiante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción del personaje de origen',
    example: 'Alumno de 23 años que estudia en la universidad',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color del personaje de origen en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}

export class CreateMandalaCenterDto {
  @ApiProperty({
    description: 'Nombre del personaje central',
    example: 'Estudiante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción del personaje central',
    example: 'Alumno de 23 años que estudia en la universidad',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color del personaje central en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({
    description: 'Personajes centrales del mandala',
    type: [CreateMandalaCenterWithOriginDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMandalaCenterWithOriginDto)
  characters?: CreateMandalaCenterWithOriginDto[];
}

export class CreateMandalaDto {
  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'ID del proyecto al que pertenece el mandala',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Personaje central del mandala',
    type: CreateMandalaCenterDto,
  })
  @ValidateNested()
  @Type(() => CreateMandalaCenterDto)
  @IsNotEmpty()
  center!: CreateMandalaCenterDto;

  @ApiProperty({
    description: 'Dimensiones del mandala',
    type: [DimensionDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
  @ArrayMinSize(1, {
    message: 'Las dimensiones no pueden estar vacías si se proporcionan',
  })
  dimensions?: DimensionDto[];

  @ApiProperty({
    description: 'Escalas del mandala',
    example: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1, {
    message: 'Las escalas no pueden estar vacías si se proporcionan',
  })
  scales?: string[];

  @ApiProperty({
    description: 'ID del mandala padre al que está vinculado este mandala',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string | null;

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
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedFiles?: string[];

  @ApiProperty({
    description:
      'Tipo de mandala a crear. Si no se especifica, se crea como CHARACTER por defecto.',
    enum: MandalaType,
    required: false,
    example: MandalaType.CHARACTER,
  })
  @IsEnum(MandalaType, {
    message:
      'El tipo debe ser uno de los valores válidos: CHARACTER, OVERLAP, OVERLAP_SUMMARY, CONTEXT',
  })
  @IsOptional()
  type?: MandalaType;
}

export class CreateOverlappedMandalaDto {
  @ApiProperty({
    description: 'Nombre del nuevo mandala superpuesto',
    example: 'Mandala Superpuesto',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description:
      'Array de IDs de mandalas para superponer (mínimo 2). Todos los mandalas deben tener las mismas dimensiones y escalas. El nuevo mandala superpuesto se guardará en el proyecto del primer mandala de la lista.',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    ],
    minItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Se requieren al menos 2 IDs de mandalas para la superposición',
  })
  @IsUUID(undefined, {
    each: true,
    message: 'Cada ID de mandala debe ser un UUID válido',
  })
  mandalas!: string[];

  @ApiProperty({
    description: 'Color del personaje central en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}
