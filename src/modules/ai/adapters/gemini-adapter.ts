import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PostitsResponse } from '../resources/dto/generate-postits.dto';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { AiRequestValidator } from '../validators/ai-request.validator';
import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';

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

    const promptFilePath =
      './src/modules/ai/resources/prompts/prompt_mandala_inicial.txt';
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
    );

    return this.parseAndValidateResponse(responseText, projectId);
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
  ): Promise<string | undefined> {
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

    return response.text;
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
