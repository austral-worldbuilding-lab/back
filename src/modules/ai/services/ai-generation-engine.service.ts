import { ExternalServiceException } from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { GoogleGenAI } from '@google/genai';
import { FileScope } from '@modules/files/types/file-scope.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { FileBufferWithScope } from '../services/file-loader.service';
import {
  CachedFileInfo,
  GeminiFileCacheService,
} from '../services/gemini-file-cache.service';
import { AiGenerationEngineContext } from '../strategies/ai-generation-strategy.interface';
import { AiUsageInfo } from '../types/ai-response-with-usage.type';

import { AiGenerationEngine } from './ai-generation-engine.interface';

interface GeminiUploadedFile {
  uri: string;
  mimeType: string;
}

interface GeminiUsageMetadata {
  totalTokenCount?: number;
  promptTokenCount?: number;
  candidatesTokenCount?: number;
}

@Injectable()
export class GeminiGenerationEngineService implements AiGenerationEngine {
  private ai: GoogleGenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilsService: AiAdapterUtilsService,
    private readonly geminiCacheService: GeminiFileCacheService,
    private readonly logger: AppLogger,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.logger.setContext(GeminiGenerationEngineService.name);
  }

  async run(
    model: string,
    prompt: string,
    responseSchema: unknown,
    context: AiGenerationEngineContext,
  ): Promise<{ text: string | undefined; usage: AiUsageInfo }> {
    const filesResult = await this.utilsService.loadAndValidateFiles(
      context.projectId,
      context.selectedFiles,
      context.mandalaId,
    );

    const geminiFiles = await this.prepareGeminiFiles(
      filesResult.toDownload,
      filesResult.cached,
      filesResult.scope,
    );

    return await this.generateContentWithFiles(
      model,
      prompt,
      geminiFiles,
      responseSchema,
    );
  }

  private async uploadFilesToGemini(
    fileBuffers: FileBufferWithScope[],
    baseScope: FileScope,
  ): Promise<GeminiUploadedFile[]> {
    if (fileBuffers.length === 0) {
      this.logger.debug('No files to upload to Gemini');
      return [];
    }

    this.logger.debug(`Uploading ${fileBuffers.length} files to Gemini...`);

    try {
      const uploadedFiles = await Promise.all(
        fileBuffers.map(async (fileBuffer) => {
          const blob = new Blob([fileBuffer.buffer], {
            type: fileBuffer.mimeType,
          });

          const file = await this.ai.files.upload({
            file: blob,
            config: {
              mimeType: fileBuffer.mimeType,
              displayName: fileBuffer.fileName,
            },
          });

          if (!file.name || !file.uri || !file.expirationTime) {
            this.logger.error(
              `Gemini API returned incomplete file data for ${fileBuffer.fileName}`,
              {
                hasName: !!file.name,
                hasUri: !!file.uri,
                hasExpirationTime: !!file.expirationTime,
              },
            );
            throw new ExternalServiceException(
              'Gemini API',
              `Incomplete file data returned for ${fileBuffer.fileName}`,
            );
          }

          const fileScope = this.buildFileScope(
            fileBuffer.sourceScope,
            baseScope,
          );
          const contextPath =
            this.geminiCacheService.buildContextPath(fileScope);

          await this.geminiCacheService.upsert({
            fileName: fileBuffer.fileName,
            fileHash: file.sha256Hash || '',
            contextPath,
            geminiFileId: file.name,
            geminiUri: file.uri,
            expiresAt: new Date(file.expirationTime),
          });

          return {
            uri: file.uri,
            mimeType: file.mimeType,
          } as GeminiUploadedFile;
        }),
      );

      this.logger.log(
        `Successfully uploaded and cached ${uploadedFiles.length} files to Gemini`,
      );
      return uploadedFiles;
    } catch (error) {
      this.logger.error('Failed to upload files to Gemini:', error);
      throw new ExternalServiceException(
        'Gemini API',
        'Failed to upload files to Gemini',
        error,
      );
    }
  }

  private async prepareGeminiFiles(
    toDownload: FileBufferWithScope[],
    cached: CachedFileInfo[],
    baseScope: FileScope,
  ): Promise<GeminiUploadedFile[]> {
    const cachedFiles = cached.map((c) => ({ uri: c.geminiUri, mimeType: '' }));
    const uploadedFiles = await this.uploadFilesToGemini(toDownload, baseScope);
    const allFiles = [...cachedFiles, ...uploadedFiles];
    this.logger.log(
      `Prepared ${allFiles.length} files for Gemini (${cached.length} cached, ${uploadedFiles.length} uploaded)`,
    );
    return allFiles;
  }

  private buildFileScope(sourceScope: string, baseScope: FileScope): FileScope {
    switch (sourceScope) {
      case 'org':
        return { orgId: baseScope.orgId };
      case 'project':
        return { orgId: baseScope.orgId, projectId: baseScope.projectId };
      case 'mandala':
        return baseScope;
      default:
        return baseScope;
    }
  }

  private parseUsageMetadata(usageMetadata: GeminiUsageMetadata): AiUsageInfo {
    return {
      totalTokens: usageMetadata?.totalTokenCount || 0,
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
    };
  }

  private async generateContentWithFiles(
    model: string,
    prompt: string,
    geminiFiles: GeminiUploadedFile[],
    responseSchema: unknown,
  ): Promise<{ text: string | undefined; usage: AiUsageInfo }> {
    const startTime = Date.now();

    this.logger.log('Sending request to Gemini API', {
      model,
      fileCount: geminiFiles.length,
      hasPromptTask: !!prompt,
    });

    try {
      const config = {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        systemInstruction: prompt,
      } as const;

      const contents = geminiFiles.map((file: GeminiUploadedFile) => ({
        role: 'user',
        content: prompt,
        parts: [
          {
            fileData: {
              fileUri: file.uri,
              mimeType: file.mimeType,
            },
          },
        ],
      }));

      const response = await this.ai.models.generateContent({
        model,
        config,
        contents,
      });

      const duration = Date.now() - startTime;
      const usage = this.parseUsageMetadata(response.usageMetadata || {});

      this.logger.log('Gemini API request completed successfully', {
        model,
        duration,
        totalTokens: usage.totalTokens,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });

      this.logger.debug('Response details', {
        responseLength: response.text?.length || 0,
        usageMetadata: response.usageMetadata,
      });

      return { text: response.text, usage };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Gemini API request failed', error, {
        model,
        duration,
        fileCount: geminiFiles.length,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      });
      throw this.mapGeminiError(error);
    }
  }

  private mapGeminiError(error: unknown): Error {
    if (!(error instanceof Error)) {
      return new ExternalServiceException(
        'Gemini API',
        'Unknown error occurred',
        error,
      );
    }
    const message = error.message.toLowerCase();
    if (
      message.includes('503') ||
      message.includes('service unavailable') ||
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network') ||
      message.includes('fetch failed')
    ) {
      return new ExternalServiceException(
        'Gemini API',
        'Gemini service is temporarily unavailable. Please try again later.',
        error,
      );
    }
    if (
      message.includes('400') ||
      message.includes('invalid') ||
      message.includes('bad request')
    ) {
      return new AiValidationException([
        'Invalid request to Gemini API: ' + error.message,
      ]);
    }
    if (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('api key')
    ) {
      this.logger.error('Gemini API authentication failed', error);
      return new ExternalServiceException(
        'Gemini API',
        'Authentication failed with Gemini API. Please check your API key.',
        error,
      );
    }
    return new ExternalServiceException(
      'Gemini API',
      'Failed to communicate with Gemini API: ' + error.message,
      error,
    );
  }
}
