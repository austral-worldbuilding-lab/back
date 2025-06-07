import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsHexadecimal,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DimensionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsHexadecimal()
  color!: string;
}

export class CreateProjectDto {
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Proyecto Comedor Austral',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description:
      'Dimensiones del proyecto. En caso de no tener dimensiones, se usarán las dimensiones por defecto.',
    example: [
      { name: 'Recursos', color: '#FF0000' },
      { name: 'Cultura', color: '#00FF00' },
      { name: 'Infraestructura', color: '#0000FF' },
      { name: 'Economía', color: '#FFFF00' },
      { name: 'Gobierno', color: '#FF00FF' },
      { name: 'Ecología', color: '#00FFFF' },
    ],
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
    example: ['Persona', 'Comunidad', 'Institución'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  scales?: string[];
}
