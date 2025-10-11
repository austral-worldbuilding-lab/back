import { promises as fs } from 'fs';
import * as path from 'path';

import {
  ExternalServiceException,
  ResourceNotFoundException,
  ValidationException,
} from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { getAiValidationConfig } from '@config/ai-validation.config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiValidationException } from '../exceptions/ai-validation.exception';

import { AiRequestValidationService } from './ai-request-validation.service';
import { FileLoaderService } from './file-loader.service';
import { FileValidationService } from './file-validation.service';

@Injectable()
export class AiAdapterUtilsService {
  private readonly minResults: number;
  private readonly maxResults: number;
  private readonly minPostits: number;
  private readonly maxPostits: number;
  private readonly minQuestions: number;
  private readonly maxQuestions: number;
  private readonly minProvocations: number;
  private readonly maxProvocations: number;
  constructor(
    private configService: ConfigService,
    private fileLoader: FileLoaderService,
    private fileValidator: FileValidationService,
    private aiRequestValidator: AiRequestValidationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AiAdapterUtilsService.name);
    const config = getAiValidationConfig();
    this.minResults = config.minResultsPerRequest;
    this.maxResults = config.maxResultsPerRequest;
    this.minPostits = config.minPostitsPerRequest;
    this.maxPostits = config.maxPostitsPerRequest;
    this.minQuestions = config.minQuestionsPerRequest;
    this.maxQuestions = config.maxQuestionsPerRequest;
    this.minProvocations = config.minProvocationsPerRequest;
    this.maxProvocations = config.maxProvocationsPerRequest;
  }

  getMaxResults(): number {
    return this.maxResults;
  }

  getMinResults(): number {
    return this.minResults;
  }

  getMinProvocations(): number {
    return this.minProvocations;
  }

  getMaxProvocations(): number {
    return this.maxProvocations;
  }

  getMinPostits(): number {
    return this.minPostits;
  }

  getMaxPostits(): number {
    return this.maxPostits;
  }

  getMinQuestions(): number {
    return this.minQuestions;
  }

  getMaxQuestions(): number {
    return this.maxQuestions;
  }

  validateConfiguration(modelConfigKey: string): string {
    const model = this.configService.get<string>(modelConfigKey);
    if (!model) {
      const errorDetails = {
        configKey: modelConfigKey,
        availableKeys: Object.keys(process.env).filter((key) =>
          key.includes('AI'),
        ),
      };

      throw new ValidationException(
        modelConfigKey,
        model,
        'Configuration key is not set in environment variables',
        errorDetails,
      );
    }

    return model;
  }

  async readPromptTemplate(promptFilePath: string): Promise<string> {
    try {
      return await fs.readFile(promptFilePath, 'utf-8');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        promptFilePath,
        originalError: errorMessage,
      };

      throw new ExternalServiceException(
        'PromptTemplate',
        `Failed to read prompt template`,
        errorDetails,
      );
    }
  }

  async getCiclo1Instructions(): Promise<string> {
    const commonInstructionPath = path.resolve(
      __dirname,
      '../resources/prompts/instrucciones_ciclo_1.txt',
    );
    return this.readPromptTemplate(commonInstructionPath);
  }

  async getCiclo3Instructions(): Promise<string> {
    const commonInstructionPath = path.resolve(
      __dirname,
      '../resources/prompts/instrucciones_ciclo_3.txt',
    );
    return this.readPromptTemplate(commonInstructionPath);
  }

  async loadAndValidateFiles(
    projectId: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ) {
    try {
      const result = await this.fileLoader.loadFiles(
        projectId,
        selectedFiles,
        mandalaId,
      );

      this.fileLoader.validateFilesLoaded(result, selectedFiles);

      const fileValidationResult = this.fileValidator.validateFiles(
        result.toDownload,
      );
      if (!fileValidationResult.isValid) {
        throw new AiValidationException(fileValidationResult.errors, projectId);
      }

      const processableFiles = this.fileValidator.excludeVideos(
        result.toDownload,
      );

      const aiValidationResult = this.aiRequestValidator.validateResponseForAi(
        processableFiles,
        this.maxResults,
      );

      if (!aiValidationResult.isValid) {
        throw new AiValidationException(aiValidationResult.errors, projectId);
      }

      return {
        toDownload: processableFiles,
        cached: result.cached,
        scope: result.scope,
      };
    } catch (error) {
      if (error instanceof AiValidationException) {
        throw error;
      }

      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        projectId,
        selectedFilesCount: selectedFiles?.length || 0,
        mandalaId,
        originalError: errorMessage,
      };

      this.logger.error(
        `loadAndValidateFiles failed for project ${projectId}`,
        errorDetails,
      );

      throw new ExternalServiceException(
        'FileProcessing',
        `Failed to load and validate files: ${errorMessage}`,
        errorDetails,
      );
    }
  }
}
