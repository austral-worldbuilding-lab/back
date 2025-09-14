import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmImageUploadDto {
  @ApiProperty({
    description:
      'ID único de la imagen (generado en el paso de presigned URL) que contiene la extensión del archivo.',
    example: '123e4567-e89b-12d3-a456-426614174002.jpg',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;
}
