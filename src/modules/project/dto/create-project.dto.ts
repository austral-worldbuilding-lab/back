import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Proyecto Comedor Austral',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción del proyecto',
    example:
      'Este proyecto busca mejorar la experiencia del comedor universitario mediante el análisis de las necesidades de los usuarios.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Dimensiones del proyecto. En caso de no tener dimensiones, se usarán las dimensiones por defecto.',
    type: [DimensionDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DimensionDto)
  @IsOptional()
  dimensions?: DimensionDto[];

  @ApiProperty({
    description:
      'Escalas del proyecto. En caso de no tener escalas, se usarán las escalas por defecto.',
    example: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  scales?: string[];

  @ApiProperty({
    description: 'ID de la organización a la que pertenece el proyecto',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;
}
