import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrl {
  @ApiProperty({
    description: 'URL firmada para subir archivo a S3',
    example: 'https://s3.amazonaws.com/bucket/file.pdf?AWSAccessKeyId=...',
  })
  url!: string;
}
