import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateChildProjectDto {
  @ApiProperty({
    description: 'Nombre del proyecto hijo',
    example: 'Subproyecto: Movilidad en el campus',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción opcional del proyecto hijo',
    example:
      'Este subproyecto explora las soluciones de movilidad dentro del campus universitario.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Icono del proyecto hijo',
    example: 'folder',
    default: 'folder',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: 'Color del icono del proyecto hijo',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  iconColor?: string;

  // heredan del padre
  @ApiProperty({
    description:
      'El organizationId se hereda automáticamente del proyecto padre',
    example: 'org-123',
    required: false,
    deprecated: true,
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description:
      'Las dimensiones se heredan automáticamente del proyecto padre',
    type: [DimensionDto],
    required: false,
    deprecated: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
  @IsOptional()
  dimensions?: DimensionDto[];

  @ApiProperty({
    description: 'Las escalas se heredan automáticamente del proyecto padre',
    type: [String],
    required: false,
    deprecated: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scales?: string[];

  @ApiProperty({
    description:
      'El userId se obtiene automáticamente del token de autenticación',
    example: 'user-123',
    required: false,
    deprecated: true,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'El parentProjectId se obtiene del parámetro de ruta',
    example: 'parent-123',
    required: false,
    deprecated: true,
  })
  @IsUUID()
  @IsOptional()
  parentProjectId?: string;
}
