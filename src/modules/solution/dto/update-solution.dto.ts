import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ActionItemDto } from './action-item.dto';

class UpdateImpactDto {
  @ApiPropertyOptional({
    description: 'Impact level',
    example: 'high',
    enum: ['low', 'medium', 'high'],
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  level?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({
    description: 'Impact description',
    example: 'Reduce un 40% los residuos no reciclados.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSolutionDto {
  @ApiPropertyOptional({
    description: 'Solution title',
    example: 'Sistema de Reciclaje Comunitario',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Solution description',
    example:
      'Implementación de puntos de reciclaje inteligentes con incentivos vecinales.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Problem being solved',
    example: 'Alta generación de residuos no clasificados en zonas urbanas.',
  })
  @IsString()
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({
    description: 'Impact of the solution',
    type: UpdateImpactDto,
  })
  @ValidateNested()
  @Type(() => UpdateImpactDto)
  @IsOptional()
  impact?: UpdateImpactDto;

  @ApiPropertyOptional({
    description: 'Related provocation IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  provocationIds?: string[];

  @ApiPropertyOptional({
    description: 'Action items for the solution',
    type: [ActionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionItemDto)
  @IsOptional()
  actionItems?: ActionItemDto[];
}

