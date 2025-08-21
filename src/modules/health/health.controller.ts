import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

import {
  ApiHealthCheck,
  ApiSimpleHealthCheck,
} from './decorators/health-swagger.decorators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiHealthCheck()
  async checkHealth(@Res() res: Response): Promise<void> {
    const healthResult = await this.healthService.checkHealth();

    // Return 503 Service Unavailable if any service is unhealthy
    const statusCode =
      healthResult.status === 'unhealthy'
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.OK;

    res.status(statusCode).json(healthResult);
  }

  @Get('simple')
  @ApiSimpleHealthCheck()
  getSimpleHealth(): string {
    return 'OK';
  }
}
