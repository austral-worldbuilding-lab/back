import * as path from 'node:path';

import { GoogleGenAI } from '@google/genai';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  PostitsComparisonResponse,
  PostitsResponse,
} from '../resources/dto/generate-postits.dto';
import { QuestionsResponse } from '../resources/dto/generate-questions.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import {
  replacePostitPlaceholders,
  replaceQuestionPlaceholders,
  replaceComparisonPlaceholders,
} from '../utils/prompt-placeholder-replacer';
import { AiRequestValidator } from '../validators/ai-request.validator';

interface GeminiUploadedFile {
  uri: string;
  mimeType: string;
}

@Injectable()
export class GeminiAdapter implements AiProvider {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiAdapter.name);

  constructor(
    private configService: ConfigService,
    private readonly validator: AiRequestValidator,
    private readonly utilsService: AiAdapterUtilsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.logger.log('Gemini Adapter initialized');
  }

  private async uploadFilesToGemini(
    fileBuffers: FileBuffer[],
  ): Promise<GeminiUploadedFile[]> {
    this.logger.debug(`Uploading ${fileBuffers.length} files to Gemini...`);

    const uploadedFiles = await Promise.all(
      fileBuffers.map(async (fileBuffer, index) => {
        this.logger.debug(
          `Uploading file ${fileBuffer.fileName} (${index + 1}/${fileBuffers.length})`,
        );

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

        return {
          uri: file.uri,
          mimeType: file.mimeType,
        } as GeminiUploadedFile;
      }),
    );

    this.logger.log(
      `Successfully uploaded ${uploadedFiles.length} files to Gemini`,
    );
    return uploadedFiles;
  }

  private async generateContentWithFiles(
    model: string,
    systemInstruction: string,
    geminiFiles: GeminiUploadedFile[],
    responseSchema: unknown,
  ): Promise<string | undefined> {
    this.logger.debug('Preparing Gemini API request...');

    const config = {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      systemInstruction: systemInstruction,
    };

    const contents = geminiFiles.map((file: GeminiUploadedFile) => ({
      role: 'user',
      parts: [
        {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType,
          },
        },
      ],
    }));

    this.logger.log('Sending request to Gemini API...');

    const response = await this.ai.models.generateContent({
      model,
      config,
      contents,
    });

    this.logger.log('Generation completed successfully');

    return response.text;
  }

  async generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiPostitResponse[]> {
    this.logger.log(`Starting postit generation for project: ${projectId}`);

    const model = this.utilsService.validateConfiguration('GEMINI_MODEL');

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_postits.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const systemInstruction = replacePostitPlaceholders(promptTemplate, {
      dimensions: dimensions,
      scales: scales,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      tags: tags,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    this.logger.log('Prompt:', systemInstruction);

    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      dimensions,
      scales,
      selectedFiles,
      mandalaId,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const responseText = await this.generateContentWithFiles(
      model,
      systemInstruction,
      geminiFiles,
      PostitsResponse,
    );

    const result = this.parseAndValidatePostitResponse(responseText, projectId);
    this.logger.log(`Postit generation completed for project: ${projectId}`);
    return result;
  }

  private parseAndValidatePostitResponse(
    responseText: string | undefined,
    projectId: string,
  ): AiPostitResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const postits = JSON.parse(responseText) as AiPostitResponse[];
      this.logger.log(
        `Successfully parsed ${postits.length} postits from AI response`,
      );

      const config = this.validator.getConfig();
      if (postits.length > config.maxResultsPerRequest) {
        this.logger.error(`Generated postits count exceeds limit`, {
          projectId,
          generatedCount: postits.length,
          maxAllowed: config.maxResultsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException(
          [
            `Generated ${postits.length} postits, but maximum allowed is ${config.maxResultsPerRequest}`,
          ],
          projectId,
        );
      }

      return postits;
    } catch (error) {
      if (error instanceof AiValidationException) {
        throw error;
      }
      this.logger.error('Failed to parse AI response as JSON:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  async generateQuestions(
    projectId: string,
    mandalaId: string,
    mandalaTextSummary: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`Starting question generation for mandala: ${mandalaId}`);

    const model = this.utilsService.validateConfiguration('GEMINI_MODEL');

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_preguntas.txt',
    );

    this.logger.debug('Processing mandala text summary:', {
      summaryLength: mandalaTextSummary.length,
      model,
    });

    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const systemInstruction = replaceQuestionPlaceholders(promptTemplate, {
      dimensions: dimensions,
      scales: scales,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      tags: tags,
      mandalaDocument: mandalaTextSummary,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });

    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      dimensions,
      scales,
      selectedFiles,
      mandalaId,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const responseText = await this.generateContentWithFiles(
      model,
      systemInstruction,
      geminiFiles,
      QuestionsResponse,
    );

    const result = this.parseAndValidateQuestionResponse(
      responseText,
      mandalaId,
    );
    this.logger.log(`Question generation completed for mandala: ${mandalaId}`);
    return result;
  }

  private parseAndValidateQuestionResponse(
    responseText: string | undefined,
    mandalaId: string,
  ): AiQuestionResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const questions = JSON.parse(responseText) as AiQuestionResponse[];
      this.logger.log(
        `Successfully parsed ${questions.length} questions from AI response`,
      );

      const config = this.validator.getConfig();
      if (questions.length > config.maxResultsPerRequest) {
        this.logger.error(`Generated questions count exceeds limit`, {
          mandalaId,
          generatedCount: questions.length,
          maxAllowed: config.maxResultsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException(
          [
            `Generated ${questions.length} questions, but maximum allowed is ${config.maxResultsPerRequest}`,
          ],
          mandalaId,
        );
      }

      return questions;
    } catch (error) {
      if (error instanceof AiValidationException) {
        throw error;
      }
      this.logger.error(
        'Failed to parse AI questions response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  async generatePostitsComparison(
    projectId: string,
    dimensions: string[],
    scales: string[],
    mandalasDocument: string,
  ): Promise<AiPostitComparisonResponse[]> {
    const model = this.utilsService.validateConfiguration('GEMINI_MODEL');

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_resumen_postits.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const systemInstruction = replaceComparisonPlaceholders(promptTemplate, {
      mandalaDocument: mandalasDocument,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    this.logger.log('Prompt:', systemInstruction);

    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      dimensions,
      scales,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const responseText = await this.generateContentWithFiles(
      model,
      systemInstruction,
      geminiFiles,
      PostitsComparisonResponse,
    );

    this.logger.log('responseText', responseText);

    const result = this.parseAndValidateComparisonResponse(responseText);
    this.logger.log(`Comparison generation completed`);
    return result;
  }

  private parseAndValidateComparisonResponse(
    responseText: string | undefined,
  ): AiPostitComparisonResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const comparisons = JSON.parse(
        responseText,
      ) as AiPostitComparisonResponse[];
      this.logger.log(
        `Successfully parsed ${comparisons.length} comparison responses from AI`,
      );

      return comparisons;
    } catch (error) {
      this.logger.error(
        'Failed to parse AI comparison response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
