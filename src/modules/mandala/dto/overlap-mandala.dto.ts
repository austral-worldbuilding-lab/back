import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { CreateMandalaCenterDto } from './create-mandala.dto';

export class OverlapMandalaConfigurationDto {
  @ApiProperty({
    description: 'Centros del mandala superpuesto',
    type: [CreateMandalaCenterDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMandalaCenterDto)
  center!: CreateMandalaCenterDto;

  @ApiProperty({
    description: 'Centros del mandala superpuesto',
    type: [CreateMandalaCenterDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMandalaCenterDto)
  centers!: CreateMandalaCenterDto[];

  @ApiProperty({
    description: 'Dimensiones del mandala',
    type: [DimensionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
  dimensions!: DimensionDto[];

  @ApiProperty({
    description: 'Escalas del mandala',
    type: [String],
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  @IsArray()
  @IsString({ each: true })
  scales!: string[];
}

export class OverlapMandalaDto {
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
    description: 'ID del proyecto al que pertenece el mandala',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Configuración del mandala con múltiples centros',
    type: OverlapMandalaConfigurationDto,
  })
  @ValidateNested()
  @Type(() => OverlapMandalaConfigurationDto)
  configuration!: OverlapMandalaConfigurationDto;

  @ApiProperty({
    description:
      'IDs de mandalas hijos (mandalas que son personajes en este mandala)',
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  childrenIds!: string[];

  @ApiProperty({
    description:
      'IDs de mandalas padre (mandalas en las que esta es un personaje)',
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  parentIds!: string[];

  @ApiProperty({ description: 'Fecha de creación del mandala' })
  @IsDate()
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización del mandala' })
  @IsDate()
  updatedAt!: Date;
}
