import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthCheckResponseDto } from '../dto/health-check-response.dto';

export const ApiHealthCheck = () =>
  applyDecorators(
    ApiTags('Health Check'),
    ApiOperation({
      summary: 'Application Health Check',
      description: `
        Comprehensive health check endpoint that verifies the status of all external services:
        - PostgreSQL Database connectivity
        - Firebase (Auth & Firestore) accessibility  
        - Azure Blob Storage connectivity
        - AI Service (Gemini) availability
        
        Returns HTTP 200 if all services are healthy, HTTP 503 if any critical service is down.
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'All services are healthy or in degraded state',
      type: HealthCheckResponseDto,
    }),
    ApiResponse({
      status: 503,
      description: 'One or more critical services are unhealthy',
      type: HealthCheckResponseDto,
    }),
  );

export const ApiSimpleHealthCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Simple Health Check',
      description:
        'Returns a simple "OK" response for basic availability check',
    }),
    ApiResponse({
      status: 200,
      description: 'Service is running',
      schema: {
        type: 'string',
        example: 'OK',
      },
    }),
  );
