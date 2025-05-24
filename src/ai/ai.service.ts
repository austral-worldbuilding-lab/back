import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { PostitsResponse } from './resources/responses/responseSchema.js';
import { FileService } from '../files/file.service';
import { FileBuffer } from '../storage/StorageService';
import * as fs from 'fs';

@Injectable()
export class AiService {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(AiService.name);

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
    this.logger.log('AI Service initialized with Gemini API');
  }

  async generatePostits(projectId: string) {
    this.logger.log(
      `Processing files for project ${projectId} for postit generation`,
    );

    // Get buffers with metadata from file service
    const fileBuffers =
      await this.fileService.readAllFilesAsBuffersWithMetadata(projectId);

    if (fileBuffers.length === 0) {
      throw new Error('No files found for project');
    }

    const geminiFiles = await this.uploadFileBuffersToGemini(
      this.ai,
      fileBuffers,
    );
    this.logger.log(
      `Successfully uploaded ${geminiFiles.length} files to Gemini`,
    );

    const systemInstruction = fs.readFileSync(
      './src/ai/resources/prompts/prompt_mandala_inicial.txt',
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

    const contents = geminiFiles.map((file) => ({
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

    this.logger.log('Received response from Gemini API');
    this.logger.debug('Response details:', response.text);

    return response.text;
  }

  async uploadFileBuffersToGemini(ai: GoogleGenAI, fileBuffers: FileBuffer[]) {
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

        return ai.files.upload({
          file: blob,
          config: {
            mimeType: fileBuffer.mimeType,
            displayName: fileBuffer.fileName,
          },
        });
      }),
    );
    this.logger.log('All file buffers uploaded successfully');
    return uploadedFiles;
  }
}
