import { ApiProperty } from '@nestjs/swagger';

import { HealthStatus } from '../types/health-status.types';

export class ServiceStatusDto {
  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded'],
    description: 'The health status of the service',
  })
  status!: HealthStatus;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 150,
  })
  responseTime!: number;

  @ApiProperty({
    description: 'Additional details about the service status',
    example: 'Connected to PostgreSQL database',
  })
  details!: string;

  @ApiProperty({
    description: 'Error message if the service is unhealthy',
    required: false,
    example: 'Connection timeout',
  })
  error?: string;
}
