import { MandalaImage } from '@modules/mandala/types/images';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import {
  TagResponseDto,
  toTagResponseDto,
} from '@/modules/project/dto/tag-response.dto';

class ImageCoordinatesResponseDto {
  @ApiProperty({
    description: 'Coordenada X de la imagen',
    example: 0.5,
  })
  x!: number;

  @ApiProperty({
    description: 'Coordenada Y de la imagen',
    example: 0.3,
  })
  y!: number;
}

export class ImageResponseDto {
  @ApiProperty({
    description: 'ID único de la imagen con la extensión',
    example: '123e4567-e89b-12d3-a456-426614174002.jpg',
  })
  id!: string;

  @ApiProperty({
    description: 'URL pública de la imagen',
    example:
      'https://storage.example.com/org/123/project/456/mandala/789/images/imagen.jpg',
  })
  url!: string;

  @ApiProperty({
    description: 'Coordenadas de la imagen',
    type: ImageCoordinatesResponseDto,
  })
  coordinates!: ImageCoordinatesResponseDto;

  @ApiProperty({
    description: 'Dimensión de la mandala',
    example: 'Físico',
  })
  dimension!: string;

  @ApiProperty({
    description: 'Sección de la mandala',
    example: 'Norte',
  })
  section!: string;

  @ApiProperty({
    description: 'Tags asociados a la imagen',
    type: [TagResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagResponseDto)
  tags!: TagResponseDto[];
}

export function toImageResponseDto(image: MandalaImage): ImageResponseDto {
  return {
    id: image.id,
    url: image.url,
    coordinates: {
      x: image.coordinates.x,
      y: image.coordinates.y,
    },
    dimension: image.dimension,
    section: image.section,
    tags: image.tags.map(toTagResponseDto),
  };
}
