import { AppLogger } from '@common/services/logger.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents } from 'bullmq';

import {
  EncyclopediaJobData,
  EncyclopediaJobResult,
  EncyclopediaJobStatus,
  EncyclopediaJobStatusResponse,
} from '../types/encyclopedia-job.types';

@Injectable()
export class EncyclopediaQueueService {
  private queue: Queue<EncyclopediaJobData, EncyclopediaJobResult>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(EncyclopediaQueueService.name);

    const redisConfig = this.configService.get<{
      host: string;
      port: number;
      password?: string;
      maxRetriesPerRequest: null;
    }>('queue.redis')!;

    this.queue = new Queue<EncyclopediaJobData, EncyclopediaJobResult>(
      'encyclopedia-generation',
      {
        connection: redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 seconds
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      },
    );

    this.logger.log('Encyclopedia queue initialized');
  }

  async addEncyclopediaJob(
    projectId: string,
    selectedFiles?: string[],
  ): Promise<string> {
    const existingJob = await this.findActiveJobForProject(projectId);

    if (existingJob) {
      this.logger.log(
        `Found existing encyclopedia job for project ${projectId}: ${existingJob.id} (${existingJob.state})`,
      );
      throw new BadRequestException(
        `An encyclopedia generation is already in progress for this project. Job ID: ${existingJob.id}`,
      );
    }

    const job = await this.queue.add(
      'generate-encyclopedia',
      { projectId, selectedFiles },
      {
        jobId: `encyclopedia-${projectId}-${Date.now()}`,
      },
    );

    this.logger.log(
      `Encyclopedia job added for project ${projectId} with ID: ${job.id}`,
    );

    return job.id!;
  }

  private async findActiveJobForProject(projectId: string) {
    const activeJobs = await this.queue.getActive();
    for (const job of activeJobs) {
      if (job.data.projectId === projectId) {
        return { id: job.id!, state: 'active' };
      }
    }

    const waitingJobs = await this.queue.getWaiting();
    for (const job of waitingJobs) {
      if (job.data.projectId === projectId) {
        return { id: job.id!, state: 'waiting' };
      }
    }

    return null;
  }

  /**
   * Get current encyclopedia job status for a project
   * Returns the active/waiting job status, or NONE if no job is active
   */
  async getJobStatusByProjectId(
    projectId: string,
  ): Promise<EncyclopediaJobStatusResponse> {
    const activeJob = await this.findActiveJobForProject(projectId);

    if (!activeJob) {
      // No job active - this is a normal state, not an error
      return {
        status: EncyclopediaJobStatus.NONE,
      };
    }

    return this.getJobStatus(activeJob.id);
  }

  private async getJobStatus(
    jobId: string,
  ): Promise<EncyclopediaJobStatusResponse> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress;
    const failedReason = job.failedReason;

    let status: EncyclopediaJobStatus;
    switch (state) {
      case 'waiting':
      case 'waiting-children':
        status = EncyclopediaJobStatus.WAITING;
        break;
      case 'active':
        status = EncyclopediaJobStatus.ACTIVE;
        break;
      case 'completed':
        status = EncyclopediaJobStatus.COMPLETED;
        break;
      case 'failed':
        status = EncyclopediaJobStatus.FAILED;
        break;
      case 'delayed':
        status = EncyclopediaJobStatus.DELAYED;
        break;
      default:
        status = EncyclopediaJobStatus.WAITING;
    }

    const response: EncyclopediaJobStatusResponse = {
      jobId: job.id!,
      status,
      progress: typeof progress === 'number' ? progress : undefined,
      createdAt: job.timestamp ? new Date(job.timestamp) : undefined,
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };

    if (status === EncyclopediaJobStatus.COMPLETED && job.returnvalue) {
      response.result = job.returnvalue;
    }

    if (status === EncyclopediaJobStatus.FAILED) {
      response.error = failedReason || 'Job failed without error message';
      response.failedReason = failedReason;
    }

    return response;
  }

  async closeQueue(): Promise<void> {
    await this.queue.close();
    this.logger.log('Encyclopedia queue closed');
  }

  async getJobById(jobId: string) {
    return this.queue.getJob(jobId);
  }

  getQueueEvents() {
    return new QueueEvents(this.queue.name, {
      connection: this.queue.opts.connection,
    });
  }
}
