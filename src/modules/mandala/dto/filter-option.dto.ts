import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FilterOptionDto {
  @ApiProperty({
    description: 'Etiqueta del filtro',
    example: 'Cultura',
  })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({
    description: 'Color del filtro en formato hexadecimal',
    example: '#FF0000',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class FilterSectionDto {
  @ApiProperty({
    description: 'Nombre de la sección de filtros',
    example: 'Dimensiones',
  })
  @IsString()
  @IsNotEmpty()
  sectionName!: string;

  @ApiProperty({
    description: 'Tipo de selección del filtro',
    example: 'multiple',
  })
  @IsString()
  @IsNotEmpty()
  type!: 'multiple';

  @ApiProperty({
    description: 'Opciones disponibles para este filtro',
    type: [FilterOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterOptionDto)
  options!: FilterOptionDto[];
}
