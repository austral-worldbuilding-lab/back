import { AppLogger } from '@common/services/logger.service';
import { AiService } from '@modules/ai/ai.service';
import { MandalaService } from '@modules/mandala/mandala.service';
import { ProjectService } from '@modules/project/project.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';

import {
  EncyclopediaJobData,
  EncyclopediaJobResult,
} from '../types/encyclopedia-job.types';
import { EncyclopediaQueueService } from '../services/encyclopedia-queue.service';
import { BaseOnDemandProcessor } from './base/on-demand.processor';

@Injectable()
export class EncyclopediaProcessor extends BaseOnDemandProcessor<
  EncyclopediaJobData,
  EncyclopediaJobResult
> {
  constructor(
    configService: ConfigService,
    logger: AppLogger,
    private readonly projectService: ProjectService,
    private readonly mandalaService: MandalaService,
    private readonly aiService: AiService,
    private readonly blobStorageService: AzureBlobStorageService,
    encyclopediaQueueService: EncyclopediaQueueService,
  ) {
    super(configService, logger, encyclopediaQueueService);
  }

  protected getQueueName(): string {
    return 'encyclopedia-generation';
  }

  protected getProcessorName(): string {
    return 'Encyclopedia';
  }

  /**
   * Processes an encyclopedia generation job.
   *
   * Steps:
   * 1. Get project
   * 2. Get mandalas with summary status
   * 3. Generate missing summaries sequentially with retry logic
   * 4. Collect all dimensions and scales
   * 5. Get all summaries
   * 6. Generate encyclopedia using AI
   * 7. Save to blob storage
   *
   * @param job - The encyclopedia job to process
   * @returns The encyclopedia result with storage URL
   */
  protected async processJob(
    job: Job<EncyclopediaJobData>,
  ): Promise<EncyclopediaJobResult> {
    const { projectId, selectedFiles } = job.data;

    this.logger.log(
      `Processing encyclopedia job ${job.id} for project ${projectId}`,
    );

    try {
      await job.updateProgress(10);
      const project = await this.projectService.findOne(projectId);

      await job.updateProgress(20);
      const mandalasWithStatus =
        await this.mandalaService.getMandalasWithSummaryStatus(projectId);

      const withoutSummary = mandalasWithStatus.filter(
        ({ hasSummary }) => !hasSummary,
      );
      const allMandalas = mandalasWithStatus.map(({ mandala }) => mandala);

      this.logger.log(
        `Found ${withoutSummary.length} mandalas without summaries out of ${allMandalas.length} total`,
      );

      if (withoutSummary.length > 0) {
        this.logger.log(
          `Generating summaries for ${withoutSummary.length} mandalas sequentially...`,
        );

        const progressPerSummary = 50 / withoutSummary.length;
        let currentProgress = 20;

        const summaryResults: { mandalaId: string; success: boolean }[] = [];

        for (const { mandala } of withoutSummary) {
          const result = await this.generateSummaryWithRetry(mandala.id);
          summaryResults.push(result);

          currentProgress += progressPerSummary;
          const progress = Math.min(currentProgress, 70);
          await job.updateProgress(progress);
        }

        const successfulSummaries = summaryResults.filter(
          (r) => r.success,
        ).length;
        const failedSummaries = summaryResults.filter((r) => !r.success).length;

        this.logger.log(
          `Summary generation completed: ${successfulSummaries} successful, ${failedSummaries} failed`,
        );

        if (failedSummaries > 0) {
          this.logger.warn(
            `Some summaries failed to generate. Proceeding with available summaries.`,
          );
        }
      }

      await job.updateProgress(75);
      const allDimensions = [
        ...new Set(
          allMandalas.flatMap((m) =>
            m.configuration.dimensions.map((d) => d.name),
          ),
        ),
      ];

      const allScales = [
        ...new Set(allMandalas.flatMap((m) => m.configuration.scales)),
      ];

      const allSummaries =
        await this.mandalaService.getAllMandalaSummariesByProjectId(projectId);

      if (!allSummaries) {
        this.logger.warn(`No summaries available for project ${projectId}`);
      }

      await job.updateProgress(80);
      this.logger.log(
        `Generating encyclopedia content for project ${projectId}`,
      );

      const encyclopediaResponse = await this.aiService.generateEncyclopedia(
        projectId,
        project.name,
        project.description || '',
        allDimensions,
        allScales,
        allSummaries,
        selectedFiles,
      );

      await job.updateProgress(90);
      const result = {
        encyclopedia: encyclopediaResponse.encyclopedia,
        storageUrl: '',
      };

      await this.saveResult(job, result);
      await job.updateProgress(100);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Encyclopedia job ${job.id} failed for project ${projectId}: ${errorMessage}`,
        { error: error instanceof Error ? error.stack : undefined },
      );
      throw error;
    }
  }

  /**
   * Saves encyclopedia to blob storage.
   *
   * @param job - The processed job
   * @param result - The encyclopedia result (storageUrl will be set)
   */
  protected async saveResult(
    job: Job<EncyclopediaJobData>,
    result: EncyclopediaJobResult,
  ): Promise<void> {
    const project = await this.projectService.findOne(job.data.projectId);
    const fileName = `Enciclopedia del mundo - ${project.name}.md`;

    this.logger.log('Saving encyclopedia to blob storage', {
      organizationId: project.organizationId,
      projectId: project.id,
      fileName,
      contentLength: result.encyclopedia.length,
    });

    const scope = {
      orgId: project.organizationId,
      projectId: project.id,
    };

    const buffer = Buffer.from(result.encyclopedia, 'utf-8');

    await this.blobStorageService.uploadBuffer(
      buffer,
      fileName,
      scope,
      'text/markdown',
    );

    const publicUrl = this.blobStorageService.buildPublicUrl(
      scope,
      fileName,
      'files',
    );

    result.storageUrl = publicUrl;

    this.logger.log('Encyclopedia saved', {
      projectId: project.id,
      fileName,
      url: publicUrl,
    });
  }

  /**
   * Generates a summary for a mandala with retry logic.
   *
   * Replicates BullMQ's retry strategy (3 attempts with exponential backoff: 2s, 4s, 8s).
   * This is necessary because summary generation doesn't use Redis/BullMQ yet.
   *
   * TODO: Remove once summaries are generated via Redis/BullMQ with their own job queue.
   *
   * @param mandalaId - The mandala ID to generate summary for
   * @returns Success status for the summary generation
   */
  private async generateSummaryWithRetry(
    mandalaId: string,
  ): Promise<{ mandalaId: string; success: boolean }> {
    const MAX_ATTEMPTS = 3;
    const INITIAL_DELAY_MS = 2000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        this.logger.debug(
          `Generating summary for mandala ${mandalaId} (attempt ${attempt}/${MAX_ATTEMPTS})`,
        );
        await this.mandalaService.generateSummaryReport(mandalaId);
        this.logger.debug(
          `Summary generated for mandala ${mandalaId} on attempt ${attempt}`,
        );
        return { mandalaId, success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(
          `Attempt ${attempt}/${MAX_ATTEMPTS} failed for mandala ${mandalaId}: ${errorMessage}`,
        );

        if (attempt === MAX_ATTEMPTS) {
          this.logger.error(
            `Failed to generate summary for mandala ${mandalaId} after ${MAX_ATTEMPTS} attempts: ${errorMessage}`,
            { error: error instanceof Error ? error.stack : undefined },
          );
          return { mandalaId, success: false };
        }

        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        this.logger.debug(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }

    return { mandalaId, success: false };
  }

  /**
   * Creates a delay promise.
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
