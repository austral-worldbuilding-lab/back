import { ApiProperty } from '@nestjs/swagger';

export class AiMandalaImageResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the image',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Base64 encoded image data (only for newly generated images)',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    required: false,
  })
  imageData?: string;

  @ApiProperty({
    description: 'Public URL of the image in blob storage',
    example:
      'https://storage.blob.core.windows.net/container/org/123/project/456/mandala/789/images/ai-generated/image.png',
  })
  url!: string;
}
