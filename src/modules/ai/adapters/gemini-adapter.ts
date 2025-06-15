import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PostitsResponse } from '../resources/dto/generate-postits.dto';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { FileService } from '@modules/files/file.service';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { replacePromptPlaceholders } from '../utils/prompt-placeholder-replacer';
import { AiRequestValidator } from '../validators/ai-request.validator';
import { AiValidationException } from '../exceptions/ai-validation.exception';
import * as fs from 'fs';

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
    private fileService: FileService,
    private readonly validator: AiRequestValidator,
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

    const model = this.validateConfiguration();

    const systemInstruction = this.preparePrompt(
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
    );

    const fileBuffers = await this.loadAndValidateFiles(
      projectId,
      dimensions,
      scales,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);

    return await this.generateWithGemini(
      projectId,
      model,
      systemInstruction,
      geminiFiles,
    );
  }

  private validateConfiguration(): string {
    this.logger.debug('Validating configuration...');

    const model = this.configService.get<string>('GEMINI_MODEL');
    if (!model) {
      throw new Error(
        'GEMINI_MODEL is not configured in environment variables',
      );
    }

    this.logger.debug(`Configuration valid - using model: ${model}`);
    return model;
  }

  private preparePrompt(
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
  ): string {
    this.logger.debug('Preparing prompt template...');

    const promptTemplate = fs.readFileSync(
      './src/modules/ai/resources/prompts/prompt_mandala_inicial.txt',
      'utf-8',
    );

    try {
      const systemInstruction = replacePromptPlaceholders(
        promptTemplate,
        dimensions,
        scales,
        centerCharacter,
        centerCharacterDescription,
        tags,
      );

      this.logger.debug('Prompt template prepared successfully');
      return systemInstruction;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to prepare prompt template:', error);
      throw new Error(`Prompt placeholder replacement failed: ${errorMessage}`);
    }
  }

  private async loadAndValidateFiles(
    projectId: string,
    dimensions: string[],
    scales: string[],
  ): Promise<FileBuffer[]> {
    this.logger.debug(`Loading files for project: ${projectId}`);

    const fileBuffers =
      await this.fileService.readAllFilesAsBuffersWithMetadata(projectId);

    if (fileBuffers.length === 0) {
      throw new Error('No files found for project');
    }

    this.logger.debug(`Loaded ${fileBuffers.length} files, validating...`);

    const validationResult = this.validator.validateAiRequest(
      fileBuffers,
      projectId,
      dimensions,
      scales,
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
    projectId: string,
    model: string,
    systemInstruction: string,
    geminiFiles: GeminiUploadedFile[],
  ): Promise<AiPostitResponse[]> {
    this.logger.debug('Preparing Gemini API request...');

    const config = {
      responseMimeType: 'application/json',
      responseSchema: PostitsResponse,
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

    return this.parseAndValidateResponse(response.text, projectId);
  }

  private parseAndValidateResponse(
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
}
