import { promises as fs } from 'fs';
import * as path from 'path';

import { getAiValidationConfig } from '@config/ai-validation.config';
import { FileService } from '@modules/files/file.service';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiRequestValidator } from '../validators/ai-request.validator';

@Injectable()
export class AiAdapterUtilsService {
  private readonly logger = new Logger(AiAdapterUtilsService.name);
  private readonly minResults: number;
  private readonly maxResults: number;
  constructor(
    private configService: ConfigService,
    private fileService: FileService,
    private validator: AiRequestValidator,
  ) {
    const config = getAiValidationConfig();
    this.minResults = config.minResultsPerRequest;
    this.maxResults = config.maxResultsPerRequest;
  }

  getMaxResults(): number {
    return this.maxResults;
  }

  getMinResults(): number {
    return this.minResults;
  }

  validateConfiguration(modelConfigKey: string): string {
    this.logger.debug(`Validating configuration...`);

    const model = this.configService.get<string>(modelConfigKey);
    if (!model) {
      throw new Error(
        `${modelConfigKey} is not configured in environment variables`,
      );
    }

    this.logger.debug(`Configuration valid - using model: ${model}`);
    return model;
  }

  async readPromptTemplate(promptFilePath: string): Promise<string> {
    this.logger.debug(`Reading prompt template from: ${promptFilePath}`);

    try {
      const promptTemplate = await fs.readFile(promptFilePath, 'utf-8');
      this.logger.debug(`Prompt template read successfully`);
      return promptTemplate;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read prompt template:`, error);
      throw new Error(`Failed to read prompt template: ${errorMessage}`);
    }
  }

  async getCommonInstructions(): Promise<string> {
    const commonInstructionPath = path.resolve(
      __dirname,
      '../resources/prompts/instrucciones_ciclo_1.txt',
    );
    return this.readPromptTemplate(commonInstructionPath);
  }

  async loadAndValidateFiles(
    projectId: string,
    dimensions: string[],
    scales: string[],
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<FileBuffer[]> {
    this.logger.debug(
      `Loading files for project: ${projectId}${mandalaId ? `, mandala: ${mandalaId}` : ''}`,
    );
    const scope = mandalaId
      ? await this.fileService.resolveScope('mandala', mandalaId)
      : await this.fileService.resolveScope('project', projectId);
    const allFileBuffers =
      await this.fileService.readAllFilesAsBuffersWithMetadata(scope);

    // Filter out video files and apply selectedFiles filter
    const fileBuffers = allFileBuffers
      .filter((file) => !file.mimeType.startsWith('video/'))
      .filter(
        (file) =>
          !selectedFiles?.length || selectedFiles.includes(file.fileName),
      );

    if (fileBuffers.length === 0) {
      const errorMessage = selectedFiles?.length
        ? `No files found matching the selected files: ${selectedFiles.join(', ')}`
        : 'No files found for project';
      throw new Error(errorMessage);
    }

    this.logger.debug(
      `Loaded ${allFileBuffers.length} files, ${selectedFiles?.length ? `filtered to ${fileBuffers.length} selected files, ` : ''}validating...`,
    );

    const validationResult = this.validator.validateAiRequest(
      fileBuffers,
      projectId,
      dimensions,
      scales,
      this.maxResults,
    );

    if (!validationResult.isValid) {
      this.logger.error(`File validation failed for project ${projectId}`, {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
      throw new AiValidationException(validationResult.errors, projectId);
    }

    this.logger.debug(`File validation passed for project ${projectId}`);
    return fileBuffers;
  }
}
