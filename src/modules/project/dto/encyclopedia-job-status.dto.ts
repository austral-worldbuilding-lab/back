import { ApiProperty } from '@nestjs/swagger';

export class EncyclopediaJobStatusDto {
  @ApiProperty({
    description: 'Unique identifier for the job (null when status is none)',
    example: 'encyclopedia-123e4567-e89b-12d3-a456-426614174000-1697234567890',
    required: false,
  })
  jobId?: string;

  @ApiProperty({
    description: 'Current status of the job',
    enum: ['none', 'waiting', 'active', 'completed', 'failed', 'delayed'],
    example: 'active',
  })
  status!: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 75,
    required: false,
  })
  progress?: number;

  @ApiProperty({
    description: 'Encyclopedia content (only when completed)',
    required: false,
  })
  encyclopedia?: string;

  @ApiProperty({
    description:
      'Storage URL for the encyclopedia markdown file (only when completed)',
    example:
      'https://storageaccount.blob.core.windows.net/container/org/org-id/project/project-id/encyclopedia.md',
    required: false,
  })
  storageUrl?: string;

  @ApiProperty({
    description:
      'Storage URL for the encyclopedia HTML file (only when completed)',
    example:
      'https://storageaccount.blob.core.windows.net/container/org/org-id/project/project-id/encyclopedia.html',
    required: false,
  })
  htmlStorageUrl?: string;

  @ApiProperty({
    description: 'Error message (only when failed)',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Detailed failure reason (only when failed)',
    required: false,
  })
  failedReason?: string;

  @ApiProperty({
    description: 'Timestamp when the job was created',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the job started processing',
    required: false,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the job finished',
    required: false,
  })
  finishedAt?: Date;
}
