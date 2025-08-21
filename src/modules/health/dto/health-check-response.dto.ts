import { ApiProperty } from '@nestjs/swagger';

import { HealthStatus } from '../types/health-status.types';

import { ServiceStatusDto } from './service-status.dto';

class ServicesHealthDto {
  @ApiProperty({ type: ServiceStatusDto })
  database!: ServiceStatusDto;

  @ApiProperty({ type: ServiceStatusDto })
  firebase!: ServiceStatusDto;

  @ApiProperty({ type: ServiceStatusDto })
  azureStorage!: ServiceStatusDto;

  @ApiProperty({ type: ServiceStatusDto })
  ai!: ServiceStatusDto;
}

export class HealthCheckResponseDto {
  @ApiProperty({
    enum: ['healthy', 'unhealthy', 'degraded'],
    description: 'Overall health status of the application',
  })
  status!: HealthStatus;

  @ApiProperty({
    description: 'Timestamp of the health check',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Application uptime in seconds',
    example: 3600,
  })
  uptime!: number;

  @ApiProperty({
    type: ServicesHealthDto,
    description: 'Health status of individual services',
  })
  services!: ServicesHealthDto;
}
