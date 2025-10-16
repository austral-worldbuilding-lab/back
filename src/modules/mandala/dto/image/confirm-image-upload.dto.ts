import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';

import { ImageTagDto } from './image-tag.dto';

export class ConfirmImageUploadDto {
  @ApiProperty({
    description:
      'ID único de la imagen (generado en el paso de presigned URL) que contiene la extensión del archivo.',
    example: '123e4567-e89b-12d3-a456-426614174002.jpg',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'Tags asociados a la imagen',
    type: [ImageTagDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ImageTagDto)
  @IsArray()
  tags?: ImageTagDto[];
}
