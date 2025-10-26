import { ApiProperty } from '@nestjs/swagger';

export class AiMandalaImageResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the image',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Base64 encoded image data',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  })
  imageData!: string;
}
