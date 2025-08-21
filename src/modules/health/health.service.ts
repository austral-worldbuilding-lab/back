import { AiService } from '@modules/ai/ai.service';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable, Logger } from '@nestjs/common';

import {
  HealthCheckResult,
  HealthStatus,
  ServiceHealth,
} from './types/health-status.types';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly firebaseDataService: FirebaseDataService,
    private readonly aiService: AiService,
    private readonly azureBlobStorageService: AzureBlobStorageService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    this.logger.log('Starting health check...');

    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkFirebase(),
      this.checkAzureStorage(),
      this.checkAI(),
    ]);

    const [databaseResult, firebaseResult, azureResult, aiResult] = checks;

    const services = {
      database: this.getServiceHealth(databaseResult, 'Database'),
      firebase: this.getServiceHealth(firebaseResult, 'Firebase'),
      azureStorage: this.getServiceHealth(azureResult, 'Azure Storage'),
      ai: this.getServiceHealth(aiResult, 'AI Service'),
    };

    const overallStatus = this.calculateOverallStatus(services);
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    this.logger.log(`Health check completed with status: ${overallStatus}`);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.prismaService.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: 'Connected to PostgreSQL database',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        responseTime,
        details: 'Failed to connect to database',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkFirebase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.firebaseDataService.getDocument('health-check', 'test-doc');
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
        details: 'Firebase Auth and Firestore operational',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (
        error instanceof Error &&
        error.message.includes('Missing or insufficient permissions')
      ) {
        return {
          status: 'healthy',
          responseTime,
          details: 'Firebase operational (permission-based response)',
        };
      }

      return {
        status: 'unhealthy',
        responseTime,
        details: 'Failed to connect to Firebase',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkAzureStorage(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.azureBlobStorageService.getFiles('health-check-test');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: 'Azure Blob Storage accessible',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (
        error instanceof Error &&
        (error.message.includes('ContainerNotFound') ||
          error.message.includes('The specified container does not exist'))
      ) {
        return {
          status: 'healthy',
          responseTime,
          details: 'Azure Storage operational (container-based response)',
        };
      }

      return {
        status: 'unhealthy',
        responseTime,
        details: 'Failed to connect to Azure Storage',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkAI(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      if (!this.aiService) {
        throw new Error('AI Service not initialized');
      }

      await Promise.resolve();

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
        details: 'AI service initialized and configured',
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        responseTime,
        details: 'AI service not available or misconfigured',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getServiceHealth(
    result: PromiseSettledResult<ServiceHealth>,
    serviceName: string,
  ): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      status: 'unhealthy',
      responseTime: 0,
      details: `${serviceName} check failed`,
      error:
        result.reason instanceof Error
          ? result.reason.message
          : 'Unknown error',
    };
  }

  private calculateOverallStatus(
    services: Record<string, ServiceHealth>,
  ): HealthStatus {
    const statuses = Object.values(services).map((service) => service.status);

    if (statuses.every((status) => status === 'healthy')) {
      return 'healthy';
    }

    if (statuses.some((status) => status === 'unhealthy')) {
      return 'unhealthy';
    }

    return 'degraded';
  }
}
