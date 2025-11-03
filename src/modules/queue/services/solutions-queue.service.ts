import { AppLogger } from '@common/services/logger.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents } from 'bullmq';

import {
  SolutionsJobData,
  SolutionsJobResult,
  SolutionsJobStatus,
  SolutionsJobStatusResponse,
} from '../types/solutions-job.types';
import { BaseOnDemandProcessor } from '../processors/base/on-demand.processor';

@Injectable()
export class SolutionsQueueService {
  private queue: Queue<SolutionsJobData, SolutionsJobResult>;
  private processor: BaseOnDemandProcessor<
    SolutionsJobData,
    SolutionsJobResult
  > | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SolutionsQueueService.name);

    const redisConfig = this.configService.get<{
      host: string;
      port: number;
      password?: string;
      maxRetriesPerRequest: null;
    }>('queue.redis')!;

    this.queue = new Queue<SolutionsJobData, SolutionsJobResult>(
      'solutions-generation',
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

    this.logger.log('Solutions queue initialized');
  }

  async addSolutionsJob(
    projectId: string,
    userId: string,
    organizationId?: string,
  ): Promise<string> {
    const existingJob = await this.findActiveJobForProject(projectId);

    if (existingJob) {
      this.logger.log(
        `Found existing solutions job for project ${projectId}: ${existingJob.id}`,
      );
      throw new BadRequestException(
        `A solutions generation is already in progress for this project. Job ID: ${existingJob.id}`,
      );
    }

    const job = await this.queue.add(
      'generate-solutions',
      { projectId, userId, organizationId },
      {
        jobId: `solutions-${projectId}-${Date.now()}`,
      },
    );

    await this.notifyJobAdded();

    return job.id!;
  }

  private async findActiveJobForProject(projectId: string) {
    const activeJobs = await this.queue.getActive();
    const waitingJobs = await this.queue.getWaiting();
    const delayedJobs = await this.queue.getDelayed();

    const allPendingJobs = [...activeJobs, ...waitingJobs, ...delayedJobs];

    return allPendingJobs.find((job) => job.data.projectId === projectId);
  }

  async getJobStatusByProjectId(
    projectId: string,
  ): Promise<SolutionsJobStatusResponse> {
    // Check active/waiting jobs first
    const activeJob = await this.findActiveJobForProject(projectId);

    if (activeJob) {
      const state = await activeJob.getState();
      return {
        jobId: activeJob.id!,
        status: this.mapJobState(state),
        progress: activeJob.progress as number | undefined,
        createdAt: new Date(activeJob.timestamp),
        processedAt: activeJob.processedOn
          ? new Date(activeJob.processedOn)
          : undefined,
        finishedAt: activeJob.finishedOn
          ? new Date(activeJob.finishedOn)
          : undefined,
      };
    }

    // Check completed jobs
    const completedJobs = await this.queue.getCompleted();
    const completedJob = completedJobs.find(
      (job) => job.data.projectId === projectId,
    );

    if (completedJob) {
      return {
        jobId: completedJob.id!,
        status: SolutionsJobStatus.COMPLETED,
        result: completedJob.returnvalue,
        createdAt: new Date(completedJob.timestamp),
        processedAt: completedJob.processedOn
          ? new Date(completedJob.processedOn)
          : undefined,
        finishedAt: completedJob.finishedOn
          ? new Date(completedJob.finishedOn)
          : undefined,
      };
    }

    // Check failed jobs
    const failedJobs = await this.queue.getFailed();
    const failedJob = failedJobs.find(
      (job) => job.data.projectId === projectId,
    );

    if (failedJob) {
      return {
        jobId: failedJob.id!,
        status: SolutionsJobStatus.FAILED,
        error: failedJob.failedReason,
        failedReason: failedJob.failedReason,
        createdAt: new Date(failedJob.timestamp),
        processedAt: failedJob.processedOn
          ? new Date(failedJob.processedOn)
          : undefined,
        finishedAt: failedJob.finishedOn
          ? new Date(failedJob.finishedOn)
          : undefined,
      };
    }

    // No job found
    return {
      status: SolutionsJobStatus.NONE,
    };
  }

  private mapJobState(state: string): SolutionsJobStatus {
    switch (state) {
      case 'completed':
        return SolutionsJobStatus.COMPLETED;
      case 'failed':
        return SolutionsJobStatus.FAILED;
      case 'active':
        return SolutionsJobStatus.ACTIVE;
      case 'waiting':
        return SolutionsJobStatus.WAITING;
      case 'delayed':
        return SolutionsJobStatus.DELAYED;
      default:
        return SolutionsJobStatus.NONE;
    }
  }

  getQueue() {
    return this.queue;
  }

  getQueueEvents() {
    return new QueueEvents(this.queue.name, {
      connection: this.queue.opts.connection,
    });
  }

  /**
   * Registers the processor to receive notifications when jobs are added.
   *
   * This allows starting the worker immediately without polling.
   *
   * @param processor - The processor instance to register
   */
  registerProcessor(
    processor: BaseOnDemandProcessor<SolutionsJobData, SolutionsJobResult>,
  ): void {
    this.processor = processor;
    this.logger.debug('Solutions processor registered');
  }

  /**
   * Notifies the processor that a new job was added.
   *
   * This starts the worker immediately if it's not running.
   */
  async notifyJobAdded(): Promise<void> {
    if (this.processor) {
      await this.processor.ensureWorkerRunning();
    }
  }
}
