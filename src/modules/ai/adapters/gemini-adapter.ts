import * as path from 'node:path';

import { GoogleGenAI } from '@google/genai';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { PostitsResponse } from '../resources/dto/generate-postits.dto';
import { QuestionsResponse } from '../resources/dto/generate-questions.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiRequestValidator } from '../validators/ai-request.validator';

import { FirestoreMandalaDocument } from '@/modules/firebase/types/firestore-character.type';

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

  async generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
  ): Promise<AiPostitResponse[]> {
    this.logger.log(`Starting postit generation for project: ${projectId}`);

    const model = this.utilsService.validateConfiguration('GEMINI_MODEL');

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_mandala_inicial.txt',
    );
    const systemInstruction = await this.utilsService.preparePrompt(
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
      promptFilePath,
    );

    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      dimensions,
      scales,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const responseText = await this.generateWithGemini(
      model,
      systemInstruction,
      geminiFiles,
      PostitsResponse,
    );

    return this.parseAndValidatePostitResponse(responseText, projectId);
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

  private async generateWithGemini(
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
      if (postits.length > config.maxPostitsPerRequest) {
        this.logger.error(`Generated postits count exceeds limit`, {
          projectId,
          generatedCount: postits.length,
          maxAllowed: config.maxPostitsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException(
          [
            `Generated ${postits.length} postits, but maximum allowed is ${config.maxPostitsPerRequest}`,
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
    mandala: FirestoreMandalaDocument,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`Starting questions generation for mandala: ${mandalaId}`);

    const model = this.utilsService.validateConfiguration('GEMINI_MODEL');

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_preguntas.txt',
    );
    const mandalaJson = JSON.stringify(mandala, null, 2);
    const systemInstruction = await this.utilsService.preparePrompt(
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
      promptFilePath,
      mandalaJson,
    );

    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      dimensions,
      scales,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const responseText = await this.generateWithGemini(
      model,
      systemInstruction,
      geminiFiles,
      QuestionsResponse,
    );

    return this.parseAndValidateQuestionResponse(responseText, mandalaId);
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
      if (questions.length > config.maxQuestionsPerRequest) {
        this.logger.error(`Generated questions count exceeds limit`, {
          mandalaId,
          generatedCount: questions.length,
          maxAllowed: config.maxQuestionsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException(
          [
            `Generated ${questions.length} questions, but maximum allowed is ${config.maxQuestionsPerRequest}`,
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
}
