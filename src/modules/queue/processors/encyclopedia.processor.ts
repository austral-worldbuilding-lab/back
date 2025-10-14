import { AppLogger } from '@common/services/logger.service';
import { AiService } from '@modules/ai/ai.service';
import { MandalaService } from '@modules/mandala/mandala.service';
import { ProjectService } from '@modules/project/project.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';

import {
  EncyclopediaJobData,
  EncyclopediaJobResult,
} from '../types/encyclopedia-job.types';

@Injectable()
export class EncyclopediaProcessor implements OnModuleInit {
  private worker!: Worker<EncyclopediaJobData, EncyclopediaJobResult>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
    private readonly projectService: ProjectService,
    private readonly mandalaService: MandalaService,
    private readonly aiService: AiService,
    private readonly blobStorageService: AzureBlobStorageService,
  ) {
    this.logger.setContext(EncyclopediaProcessor.name);
  }

  onModuleInit() {
    const redisConfig = this.configService.get<{
      host: string;
      port: number;
      password?: string;
      maxRetriesPerRequest: null;
    }>('queue.redis')!;

    this.worker = new Worker<EncyclopediaJobData, EncyclopediaJobResult>(
      'encyclopedia-generation',
      async (job: Job<EncyclopediaJobData>) => {
        return this.processEncyclopediaJob(job);
      },
      {
        connection: redisConfig,
        concurrency: 1, // Process one encyclopedia at a time to avoid overwhelming AI
      },
    );

    this.worker.on('completed', (job: Job<EncyclopediaJobData>) => {
      this.logger.log(
        `Encyclopedia job ${job.id} completed for project ${job.data.projectId}`,
      );
    });

    this.worker.on(
      'failed',
      (job: Job<EncyclopediaJobData> | undefined, err: Error) => {
        this.logger.error(
          `Encyclopedia job ${job?.id} failed for project ${job?.data.projectId}: ${err.message}`,
          { error: err.stack },
        );
      },
    );

    this.logger.log('Encyclopedia processor initialized');
  }

  private async processEncyclopediaJob(
    job: Job<EncyclopediaJobData>,
  ): Promise<EncyclopediaJobResult> {
    const { projectId, selectedFiles } = job.data;

    this.logger.log(
      `Processing encyclopedia job ${job.id} for project ${projectId}`,
    );

    try {
      // Step 1: Get project
      await job.updateProgress(10);
      const project = await this.projectService.findOne(projectId);

      // Step 2: Get mandalas with summary status
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

      // Step 3: Generate missing summaries sequentially with better error handling
      if (withoutSummary.length > 0) {
        this.logger.log(
          `Generating summaries for ${withoutSummary.length} mandalas sequentially...`,
        );

        const progressPerSummary = 50 / withoutSummary.length; // Allocate 50% progress for summaries
        let currentProgress = 20;

        const summaryResults: { mandalaId: string; success: boolean }[] = [];

        for (const { mandala } of withoutSummary) {
          let summarySuccess = false;
          let lastError: Error | null = null;

          // Retry logic for mandala summary generation
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              this.logger.log(
                `Generating summary for mandala ${mandala.id} (attempt ${attempt}/3)`,
              );
              await this.mandalaService.generateSummaryReport(mandala.id);
              summaryResults.push({ mandalaId: mandala.id, success: true });
              this.logger.log(
                `Successfully generated summary for mandala ${mandala.id} on attempt ${attempt}`,
              );
              summarySuccess = true;
              break; // Success, exit retry loop
            } catch (error) {
              lastError =
                error instanceof Error ? error : new Error('Unknown error');
              this.logger.warn(
                `Attempt ${attempt}/3 failed for mandala ${mandala.id}: ${lastError.message}`,
              );

              // Wait before retry (exponential backoff: 2s, 4s, 8s)
              //TODO handle each AI request with its own job
              if (attempt < 3) {
                const delayMs = 2000 * Math.pow(2, attempt - 1);
                this.logger.log(`Waiting ${delayMs}ms before retry...`);
                await this.delay(delayMs);
              }
            }
          }

          if (!summarySuccess) {
            this.logger.error(
              `Failed to generate summary for mandala ${mandala.id} after 3 attempts: ${lastError?.message}`,
              { error: lastError?.stack },
            );
            summaryResults.push({ mandalaId: mandala.id, success: false });
          }

          currentProgress += progressPerSummary;
          await job.updateProgress(Math.min(currentProgress, 70));

          // Add delay between AI requests to avoid rate limiting
          const currentIndex = withoutSummary.findIndex(
            (item) => item.mandala.id === mandala.id,
          );
          if (currentIndex < withoutSummary.length - 1) {
            await this.delay(2000); // 2 second delay between summaries
          }
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

      // Step 4: Collect all dimensions and scales
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

      // Step 5: Get all summaries
      const allSummaries =
        await this.mandalaService.getAllMandalaSummariesByProjectId(projectId);

      if (!allSummaries) {
        this.logger.warn(`No summaries available for project ${projectId}`);
      }

      // Step 6: Generate encyclopedia using AI
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

      // Step 7: Save to blob storage
      await job.updateProgress(90);
      const fileName = `Enciclopedia del mundo - ${project.name}.md`;

      const storageUrl = await this.saveEncyclopedia(
        encyclopediaResponse.encyclopedia,
        project.organizationId,
        project.id,
        fileName,
      );

      await job.updateProgress(100);

      this.logger.log(
        `Encyclopedia generation completed for project ${projectId}`,
      );

      return {
        encyclopedia: encyclopediaResponse.encyclopedia,
        storageUrl,
      };
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

  private async saveEncyclopedia(
    content: string,
    organizationId: string,
    projectId: string,
    fileName: string,
  ): Promise<string> {
    this.logger.log('Saving encyclopedia to blob storage', {
      organizationId,
      projectId,
      fileName,
      contentLength: content.length,
    });

    const scope = {
      orgId: organizationId,
      projectId: projectId,
    };

    const buffer = Buffer.from(content, 'utf-8');

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

    this.logger.log('Successfully saved encyclopedia', {
      organizationId,
      projectId,
      fileName,
      publicUrl,
      contentLength: content.length,
    });

    return publicUrl;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onModuleDestroy() {
    await this.worker.close();
    this.logger.log('Encyclopedia processor closed');
  }
}
