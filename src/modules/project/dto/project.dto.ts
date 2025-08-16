import { ProjectConfiguration } from '@modules/project/types/project-configuration.type';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ProjectDto {
  @ApiProperty({
    description: 'ID único del proyecto',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

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
  description?: string | null;

  @ApiProperty({
    description: 'Configuración del proyecto',
    type: ProjectConfiguration,
  })
  @ValidateNested()
  @Type(() => ProjectConfiguration)
  configuration!: ProjectConfiguration;

  @ApiProperty({
    description: 'Fecha de creación del proyecto',
    example: '2023-01-01T12:00:00.000Z',
  })
  @IsDate()
  createdAt!: Date;
}
