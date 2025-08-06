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
    example: ['Persona', 'Comunidad', 'Institución'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  scales?: string[];
}
