import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { PostitsResponse } from '../resources/dto/generate-postits.dto';
import { FileService } from '@modules/files/file.service';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { Postit } from '@modules/mandala/types/postits';
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

  async generatePostits(projectId: string): Promise<Postit[]> {
    this.logger.log(
      `Processing files for project ${projectId} for postit generation`,
    );

    // Get buffers with metadata from file service
    const fileBuffers =
      await this.fileService.readAllFilesAsBuffersWithMetadata(projectId);

    if (fileBuffers.length === 0) {
      throw new Error('No files found for project');
    }

    const geminiFiles = await this.uploadFiles(fileBuffers);
    this.logger.log(
      `Successfully uploaded ${geminiFiles.length} files to Gemini`,
    );

    const systemInstruction = fs.readFileSync(
      './src/modules/ai/resources/prompts/prompt_mandala_inicial.txt',
      'utf-8',
    );
    this.logger.log('Loaded system instruction from prompt file');

    const model = this.configService.get<string>('GEMINI_MODEL');
    if (!model) {
      throw new Error(
        'GEMINI_MODEL is not configured in environment variables',
      );
    }
    this.logger.log(`Using Gemini model: ${model}`);

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

    if (!response.text) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const postits = JSON.parse(response.text) as Postit[];
      this.logger.log(
        `Successfully parsed ${postits.length} postits from AI response`,
      );
      return postits;
    } catch (error) {
      this.logger.error('Failed to parse AI response as JSON:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  async uploadFiles(fileBuffers: FileBuffer[]): Promise<GeminiUploadedFile[]> {
    this.logger.log(
      `Starting upload of ${fileBuffers.length} file buffers to Gemini`,
    );
    const uploadedFiles = await Promise.all(
      fileBuffers.map(async (fileBuffer, index) => {
        this.logger.debug(
          `Uploading file ${fileBuffer.fileName} (${index + 1}/${fileBuffers.length})`,
        );

        // Convert Buffer to Blob for Gemini upload using the actual MIME type
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
        // Ensure the returned object matches GeminiUploadedFile
        return {
          uri: file.uri,
          mimeType: file.mimeType,
        } as GeminiUploadedFile;
      }),
    );
    this.logger.log('All file buffers uploaded successfully');
    return uploadedFiles;
  }
}
