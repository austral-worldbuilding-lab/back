import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'ID único generado para la imagen',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  imageId!: string;

  @ApiProperty({
    description: 'URL firmada para subir la imagen directamente a S3',
    example: 'https://storage.example.com/presigned-url-with-sas-token...',
  })
  presignedUrl!: string;
}
