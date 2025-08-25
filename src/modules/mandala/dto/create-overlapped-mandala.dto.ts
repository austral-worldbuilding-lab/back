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
} from 'class-validator';

import { CreateMandalaCenterDto } from './create-mandala.dto';

export class CreateOverlappedMandalaDto {
  @ApiProperty({
    description: 'Nombre del mandala superpuesto',
    example: 'Unión de 3 Mandalas',
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
    description: 'Lista de personajes centrales de las mandalas originales',
    type: [CreateMandalaCenterDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one center character is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateMandalaCenterDto)
  centers!: CreateMandalaCenterDto[];

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
    example: ['Persona', 'Comunidad', 'Institución'],
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
}
