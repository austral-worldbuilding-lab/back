import { ApiProperty } from '@nestjs/swagger';

export class EncyclopediaJobResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the encyclopedia generation job',
    example: 'encyclopedia-123e4567-e89b-12d3-a456-426614174000-1697234567890',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Message indicating the job has been queued for processing',
    example: 'Encyclopedia generation job has been queued',
  })
  message!: string;
}
