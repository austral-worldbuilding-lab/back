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

export class CreateProjectFromProvocationDto {
  @ApiProperty({
    description: 'ID de la provocación que originará el proyecto',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  fromProvocationId!: string;

  @ApiProperty({
    description:
      'ID de la organización a la que pertenece el proyecto. Si se especifica y existe un proyecto padre, debe coincidir exactamente con la organización del padre.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description:
      'Nombre del proyecto. Se usará solo si no existe un proyecto padre. Si existe proyecto padre, el nombre será: "{Nombre Padre}: {Título Provocación}". Requerido solo cuando la provocación no fue generada por ningún proyecto.',
    example: 'Proyecto Comedor Austral',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description:
      'Dimensiones del proyecto. Si no se especifican, se heredarán del proyecto padre (si existe) o se usarán las dimensiones por defecto. Si se especifican y existe un proyecto padre, deben coincidir exactamente con las dimensiones del padre.',
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
      'Escalas del proyecto. Si no se especifican, se heredarán del proyecto padre (si existe) o se usarán las escalas por defecto. Si se especifican y existe un proyecto padre, deben coincidir exactamente con las escalas del padre.',
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
