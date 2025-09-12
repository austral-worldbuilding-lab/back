import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class ConfirmImageUploadDto {
  @ApiProperty({
    description: 'ID único de la imagen',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'URL pública de la imagen en S3',
    example:
      'https://storage.example.com/org/123/project/456/mandala/789/images/imagen.jpg',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;
}
