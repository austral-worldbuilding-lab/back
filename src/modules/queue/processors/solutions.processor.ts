import { AppLogger } from '@common/services/logger.service';
import { AiService } from '@modules/ai/ai.service';
import { ProjectService } from '@modules/project/project.service';
import { SolutionService } from '@modules/solution/solution.service';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';

import { EncyclopediaQueueService } from '../services/encyclopedia-queue.service';
import { SolutionsQueueService } from '../services/solutions-queue.service';
import {
  SolutionsJobData,
  SolutionsJobResult,
} from '../types/solutions-job.types';

import { BaseOnDemandProcessor } from './base/on-demand.processor';

@Injectable()
export class SolutionsProcessor extends BaseOnDemandProcessor<
  SolutionsJobData,
  SolutionsJobResult
> {
  constructor(
    configService: ConfigService,
    logger: AppLogger,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    @Inject(forwardRef(() => SolutionService))
    private readonly solutionService: SolutionService,
    private readonly aiService: AiService,
    private readonly encyclopediaQueueService: EncyclopediaQueueService,
    solutionsQueueService: SolutionsQueueService,
  ) {
    super(configService, logger, solutionsQueueService);
  }

  protected getQueueName(): string {
    return 'solutions-generation';
  }

  protected getProcessorName(): string {
    return 'Solutions';
  }

  /**
   * Processes a solutions generation job.
   *
   * Steps:
   * 1. Get project
   * 2. Check if encyclopedia already exists for the project
   * 3. If exists and completed, use it; otherwise queue encyclopedia generation
   * 4. Wait for encyclopedia job to complete if needed
   * 5. Generate solutions using encyclopedia
   * 6. Save solutions to cache
   *
   * @param job - The solutions job to process
   * @returns The solutions result
   */
  protected async processJob(
    job: Job<SolutionsJobData>,
  ): Promise<SolutionsJobResult> {
    const { projectId, userId, organizationId } = job.data;

    this.logger.log(
      `Processing solutions job ${job.id} for project ${projectId}`,
    );

    try {
      await job.updateProgress(10);
      const project = await this.projectService.findOne(projectId);

      await job.updateProgress(20);
      this.logger.log(
        `Checking if encyclopedia exists for project ${projectId}`,
      );

      let encyclopediaContent: string | null =
        await this.projectService.getEncyclopediaContent(projectId);

      if (encyclopediaContent) {
        this.logger.log(`Using existing encyclopedia for project ${projectId}`);
        await job.updateProgress(50);
      } else {
        this.logger.log(
          `No completed encyclopedia found for project ${projectId}, queueing new generation`,
        );
        const encyclopediaJobId =
          await this.projectService.queueEncyclopediaGeneration(projectId);

        this.logger.log(
          `Waiting for encyclopedia job ${encyclopediaJobId} to complete`,
        );

        const encyclopediaResult = await this.waitForEncyclopediaJob(
          encyclopediaJobId,
          job,
        );
        encyclopediaContent = encyclopediaResult.encyclopedia;
        await job.updateProgress(50);
      }

      await job.updateProgress(60);
      this.logger.log(
        `Generating solutions for project ${projectId} using encyclopedia`,
      );

      // At this point, encyclopediaContent is guaranteed to be a string
      // (either from existing encyclopedia or newly generated)
      if (!encyclopediaContent) {
        throw new Error(
          `Failed to obtain encyclopedia content for project ${projectId}`,
        );
      }

      const solutions = await this.aiService.generateSolutions(
        projectId,
        project.name,
        project.description || '',
        encyclopediaContent,
        userId,
        organizationId,
      );

      await job.updateProgress(90);
      await this.saveResult(job, { solutions });
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
   * Waits for encyclopedia job to complete using BullMQ's waitUntilFinished.
   *
   * This leverages BullMQ's built-in mechanisms instead of manual polling.
   * The encyclopedia job handles its own timeout via defaultJobOptions.
   *
   * @param encyclopediaJobId - The encyclopedia job ID to wait for
   * @param _solutionsJob - The solutions job (unused, kept for future use)
   * @returns The encyclopedia result
   */
  private async waitForEncyclopediaJob(
    encyclopediaJobId: string,
    _solutionsJob: Job<SolutionsJobData>,
  ): Promise<{ encyclopedia: string }> {
    try {
      const encyclopediaJob =
        await this.encyclopediaQueueService.getJobById(encyclopediaJobId);

      if (!encyclopediaJob) {
        throw new Error(
          `Encyclopedia job ${encyclopediaJobId} not found in queue`,
        );
      }

      const result = (await encyclopediaJob.waitUntilFinished(
        this.encyclopediaQueueService.getQueueEvents(),
      )) as { encyclopedia: string } | undefined;

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

  /**
   * Saves generated solutions to cache.
   *
   * Progress updates are handled by the caller (processJob).
   *
   * @param job - The processed job
   * @param result - The solutions result to save
   */
  protected async saveResult(
    job: Job<SolutionsJobData>,
    result: SolutionsJobResult,
  ): Promise<void> {
    await this.solutionService.saveSolutionsToCache(
      job.data.projectId,
      result.solutions,
    );
  }
}
