import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreateProjectFromQuestionDto {
  @ApiProperty({
    description: 'Pregunta que originará la provocación y el proyecto',
    example:
      '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  question!: string;

  @ApiProperty({
    description: 'ID de la organización a la que pertenece el proyecto.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description:
      'Nombre del proyecto. Si no se especifica, se usará la pregunta como nombre.',
    example: 'Proyecto Festejódromo Universitario',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descripción del proyecto.',
    example:
      'Este proyecto busca crear un espacio dedicado para la celebración de festejos de graduación en la universidad, promoviendo la convivencia y el sentido de comunidad entre los estudiantes.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Dimensiones del proyecto. Si no se especifican, se usarán las dimensiones por defecto.',
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
      'Escalas del proyecto. Si no se especifican, se usarán las escalas por defecto.',
    example: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  scales?: string[];

  @ApiProperty({
    description: 'Icono del proyecto',
    example: 'icono-proyecto',
  })
  @IsString()
  @IsNotEmpty()
  icon!: string;

  @ApiProperty({
    description: 'Color del icono del proyecto',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  iconColor?: string;
}
