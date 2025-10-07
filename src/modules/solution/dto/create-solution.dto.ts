import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateImpactDto {
  @ApiProperty({
    description: 'Impact level',
    example: 'high',
    enum: ['low', 'medium', 'high'],
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsNotEmpty()
  level!: 'low' | 'medium' | 'high';

  @ApiProperty({
    description: 'Impact description',
    example: 'Reduce un 40% los residuos no reciclados.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class CreateSolutionDto {
  @ApiProperty({
    description: 'Solution title',
    example: 'Sistema de Reciclaje Comunitario',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Solution description',
    example:
      'Implementación de puntos de reciclaje inteligentes con incentivos vecinales.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Problem being solved',
    example: 'Alta generación de residuos no clasificados en zonas urbanas.',
  })
  @IsString()
  @IsNotEmpty()
  problem!: string;

  @ApiPropertyOptional({
    description: 'Impact of the solution',
    type: CreateImpactDto,
  })
  @ValidateNested()
  @Type(() => CreateImpactDto)
  @IsOptional()
  impact?: CreateImpactDto;

  @ApiPropertyOptional({
    description: 'Related provocation IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  provocationIds?: string[];
}
