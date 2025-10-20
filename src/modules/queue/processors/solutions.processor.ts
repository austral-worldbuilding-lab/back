import { AppLogger } from '@common/services/logger.service';
import { AiService } from '@modules/ai/ai.service';
import { ProjectService } from '@modules/project/project.service';
import { SolutionService } from '@modules/solution/solution.service';
import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';

import { EncyclopediaQueueService } from '../services/encyclopedia-queue.service';
import {
  SolutionsJobData,
  SolutionsJobResult,
} from '../types/solutions-job.types';

@Injectable()
export class SolutionsProcessor implements OnModuleInit {
  private worker!: Worker<SolutionsJobData, SolutionsJobResult>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    @Inject(forwardRef(() => SolutionService))
    private readonly solutionService: SolutionService,
    private readonly aiService: AiService,
    private readonly encyclopediaQueueService: EncyclopediaQueueService,
  ) {
    this.logger.setContext(SolutionsProcessor.name);
  }

  onModuleInit() {
    const redisConfig = this.configService.get<{
      host: string;
      port: number;
      password?: string;
      maxRetriesPerRequest: null;
    }>('queue.redis')!;

    this.worker = new Worker<SolutionsJobData, SolutionsJobResult>(
      'solutions-generation',
      async (job: Job<SolutionsJobData>) => {
        return this.processSolutionsJob(job);
      },
      {
        connection: redisConfig,
        concurrency: 1, // Process one solution generation at a time
      },
    );

    this.worker.on('completed', (job: Job<SolutionsJobData>) => {
      this.logger.log(
        `Solutions job ${job.id} completed for project ${job.data.projectId}`,
      );
    });

    this.worker.on(
      'failed',
      (job: Job<SolutionsJobData> | undefined, err: Error) => {
        this.logger.error(
          `Solutions job ${job?.id} failed for project ${job?.data.projectId}: ${err.message}`,
          { error: err.stack },
        );
      },
    );

    this.logger.log('Solutions processor initialized');
  }

  private async processSolutionsJob(
    job: Job<SolutionsJobData>,
  ): Promise<SolutionsJobResult> {
    const { projectId, userId, organizationId } = job.data;

    this.logger.log(
      `Processing solutions job ${job.id} for project ${projectId}`,
    );

    try {
      // Step 1: Get project
      await job.updateProgress(10);
      const project = await this.projectService.findOne(projectId);

      // Step 2: Queue encyclopedia generation and wait for completion using BullMQ
      await job.updateProgress(20);
      this.logger.log(
        `Queueing encyclopedia generation for project ${projectId}...`,
      );

      const encyclopediaJobId =
        await this.projectService.queueEncyclopediaGeneration(projectId);

      this.logger.log(
        `Encyclopedia job queued with ID: ${encyclopediaJobId}. Waiting for completion...`,
      );

      // Step 3: Wait for encyclopedia job to complete using BullMQ's waitUntilFinished
      const encyclopediaResult = await this.waitForEncyclopediaJob(
        encyclopediaJobId,
        job,
      );

      // Step 4: Generate solutions using encyclopedia
      await job.updateProgress(60);
      this.logger.log(
        `Generating solutions for project ${projectId} using encyclopedia`,
      );

      const solutions = await this.aiService.generateSolutions(
        projectId,
        project.name,
        project.description || '',
        encyclopediaResult.encyclopedia,
        userId,
        organizationId,
      );

      // Step 5: Save solutions to cache
      await job.updateProgress(90);
      await this.solutionService.saveSolutionsToCache(projectId, solutions);

      await job.updateProgress(100);

      this.logger.log(
        `Solutions generation completed for project ${projectId}, generated ${solutions.length} solutions`,
      );

      return {
        solutions,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Solutions job ${job.id} failed for project ${projectId}: ${errorMessage}`,
        { error: error instanceof Error ? error.stack : undefined },
      );
      throw error;
    }
  }

  /**
   * Wait for encyclopedia job to complete using BullMQ's waitUntilFinished
   * This leverages BullMQ's built-in mechanisms instead of manual polling
   */
  private async waitForEncyclopediaJob(
    encyclopediaJobId: string,
    _solutionsJob: Job<SolutionsJobData>,
  ): Promise<{ encyclopedia: string }> {
    this.logger.log(
      `Waiting for encyclopedia job ${encyclopediaJobId} using BullMQ waitUntilFinished...`,
    );

    try {
      // Get the encyclopedia job from the queue
      const encyclopediaJob =
        await this.encyclopediaQueueService.getJobById(encyclopediaJobId);

      if (!encyclopediaJob) {
        throw new Error(
          `Encyclopedia job ${encyclopediaJobId} not found in queue`,
        );
      }

      // Wait for the job to finish using BullMQ's built-in mechanism
      // This is much more efficient than polling
      const result = (await encyclopediaJob.waitUntilFinished(
        this.encyclopediaQueueService.getQueueEvents(),
        30 * 60 * 1000, // 30 minutes timeout
      )) as { encyclopedia: string } | undefined;

      this.logger.log(
        `Encyclopedia job ${encyclopediaJobId} completed successfully`,
      );

      if (!result?.encyclopedia) {
        throw new Error(
          `Encyclopedia job completed but no encyclopedia content was returned`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to wait for encyclopedia job ${encyclopediaJobId}: ${errorMessage}`,
        { error: error instanceof Error ? error.stack : undefined },
      );
      throw new Error(`Encyclopedia generation failed: ${errorMessage}`);
    }
  }

  async onModuleDestroy() {
    await this.worker.close();
    this.logger.log('Solutions processor closed');
  }
}
