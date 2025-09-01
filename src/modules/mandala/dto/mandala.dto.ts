import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { CreateMandalaConfiguration } from '../types/mandala-configuration.type';
import { MandalaType } from '../types/mandala-type.enum';

export class MandalaCharacterDto {
  @ApiProperty({
    description: 'ID del mandala de origen del personaje',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'Nombre del personaje',
    example: 'Estudiante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Color del personaje en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsString()
  @IsNotEmpty()
  color!: string;
}

export class MandalaDto {
  @ApiProperty({
    description: 'ID único del mandala',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Tipo de mandala según su función en el sistema',
    enum: MandalaType,
    example: MandalaType.OVERLAP,
  })
  @IsEnum(MandalaType)
  type!: MandalaType;

  @ApiProperty({
    description: 'ID del proyecto al que pertenece el mandala',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Configuración del mandala',
    type: CreateMandalaConfiguration,
  })
  @ValidateNested()
  @Type(() => CreateMandalaConfiguration)
  configuration!: CreateMandalaConfiguration;

  @ApiProperty({
    description:
      'IDs de los mandalas hijos (mandalas que son personajes en este mandala)',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    ],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  childrenIds!: string[];

  @ApiProperty({
    description:
      'IDs de los mandalas padres (mandalas en los que este es un personaje)',
    type: [String],
    example: [
      'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
      'd4e5f6a7-b8c9-0123-4567-890abcdef123',
    ],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  parentIds!: string[];

  @ApiProperty({
    description: 'Fecha de creación del mandala',
    example: '2023-01-01T12:00:00.000Z',
  })
  @IsDate()
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del mandala',
    example: '2023-01-02T12:00:00.000Z',
  })
  @IsDate()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Lista de personajes para mandalas unificadas (tipo OVERLAP)',
    type: [MandalaCharacterDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MandalaCharacterDto)
  characters?: MandalaCharacterDto[];
}
