import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDimensionDto } from '../types/dimension.type';

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
  @IsOptional()
  @ArrayMinSize(1, {
    message: 'Las dimensiones no pueden estar vacías si se proporcionan',
  })
  dimensions?: CreateDimensionDto[];

  @ApiProperty({
    description:
      'Escalas del proyecto. En caso de no tener escalas, se usarán las escalas por defecto.',
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
}
