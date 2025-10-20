import { ApiProperty } from '@nestjs/swagger';

import { AiSolutionResponse } from '../types/solutions.type';

export class SolutionsJobStatusDto {
  @ApiProperty({
    description: 'Job ID if job exists',
    example: 'solutions-abc123-1234567890',
    required: false,
  })
  jobId?: string;

  @ApiProperty({
    description: 'Current status of the job',
    enum: ['none', 'waiting', 'active', 'completed', 'failed', 'delayed'],
    example: 'completed',
  })
  status!: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 75,
    required: false,
  })
  progress?: number;

  @ApiProperty({
    description: 'Generated solutions (only when completed)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        problem: { type: 'string' },
        impactLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        impactDescription: { type: 'string' },
      },
    },
    required: false,
  })
  solutions?: AiSolutionResponse[];

  @ApiProperty({
    description: 'Error message if failed',
    example: 'Failed to generate solutions',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Detailed failure reason',
    required: false,
  })
  failedReason?: string;

  @ApiProperty({
    description: 'Job creation timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Job processing started timestamp',
    example: '2024-01-15T10:31:00Z',
    required: false,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Job completion timestamp',
    example: '2024-01-15T10:35:00Z',
    required: false,
  })
  finishedAt?: Date;
}
