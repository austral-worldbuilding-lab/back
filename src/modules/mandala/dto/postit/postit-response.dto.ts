import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { PostitWithCoordinates } from '../../types/postits';

import {
  TagResponseDto,
  toTagResponseDto,
} from '@/modules/project/dto/tag-response.dto';

export class PostitResponseDto {
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
    description: 'Post-its hijos',
    type: () => [PostitResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostitResponseDto)
  childrens!: PostitResponseDto[];

  @ApiProperty({
    description: 'Nombre del archivo de imagen asociado al post-it (opcional)',
    required: false,
    example: 'image.jpg',
  })
  @IsString()
  imageFileName?: string;

  @ApiProperty({
    description:
      'URL firmada para subir la imagen (solo presente cuando se proporciona imageFileName)',
    required: false,
    example:
      'https://storageaccount.blob.core.windows.net/container/path/image.jpg?sv=...',
  })
  @IsString()
  presignedUrl?: string;
}

export function toPostitResponseDto(
  postit: PostitWithCoordinates,
): PostitResponseDto {
  return {
    id: postit.id,
    content: postit.content,
    dimension: postit.dimension,
    section: postit.section,
    tags: postit.tags.map(toTagResponseDto),
    childrens: postit.childrens.map(toPostitResponseDto),
    ...(postit.imageFileName && { imageFileName: postit.imageFileName }),
    ...(postit.presignedUrl && { presignedUrl: postit.presignedUrl }),
  };
}
