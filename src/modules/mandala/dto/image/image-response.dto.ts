import {
  MandalaImage,
  MandalaImageWithPresignedUrl,
} from '@modules/mandala/types/images';
import { ApiProperty } from '@nestjs/swagger';

class ImageCoordinatesResponseDto {
  @ApiProperty({
    description: 'Coordenada X de la imagen',
    example: 50.5,
  })
  x!: number;

  @ApiProperty({
    description: 'Coordenada Y de la imagen',
    example: 25.3,
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
    description: 'URL firmada para subir la imagen (solo al crear)',
    example: 'https://storage.example.com/presigned-url...',
    required: false,
  })
  presignedUrl?: string;
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
  };
}

export function toImageResponseDtoWithPresignedUrl(
  image: MandalaImageWithPresignedUrl,
): ImageResponseDto {
  return {
    id: image.id,
    url: image.url,
    coordinates: {
      x: image.coordinates.x,
      y: image.coordinates.y,
    },
    dimension: image.dimension,
    section: image.section,
    presignedUrl: image.presignedUrl,
  };
}
