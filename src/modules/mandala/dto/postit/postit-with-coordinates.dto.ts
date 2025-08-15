import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { TagResponseDto } from '@/modules/project/dto/tag-response.dto';

export class PostitCoordinatesDto {
  @ApiProperty({
    description: 'X coordinate as percentile (0-100)',
    example: 25.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  x!: number;

  @ApiProperty({
    description: 'Y coordinate as percentile (0-100)',
    example: 75.2,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  y!: number;
}

export class PostitWithCoordinatesDto {
  @ApiProperty({
    description: 'ID único del post-it',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Contenido del post-it',
    example: 'Contenido de ejemplo',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Dimensión a la que pertenece el post-it',
    example: 'Cultura',
  })
  @IsString()
  @IsNotEmpty()
  dimension!: string;

  @ApiProperty({
    description: 'Sección a la que pertenece el post-it',
    example: 'Comunidad',
  })
  @IsString()
  @IsNotEmpty()
  section!: string;

  @ApiProperty({
    description: 'Tags asociados al post-it',
    type: [TagResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagResponseDto)
  tags!: TagResponseDto[];

  @ApiProperty({
    description: 'Coordenadas del post-it en el mandala',
    type: PostitCoordinatesDto,
  })
  @ValidateNested()
  @Type(() => PostitCoordinatesDto)
  coordinates!: PostitCoordinatesDto;

  @ApiProperty({
    description: 'Post-its hijos',
    type: () => [PostitWithCoordinatesDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostitWithCoordinatesDto)
  childrens!: PostitWithCoordinatesDto[];
}
