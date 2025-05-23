import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { PostitsResponse } from './resources/responses/responseSchema.js';
import * as fs from 'fs';

@Injectable()
export class AiService {
    private ai: GoogleGenAI;
    private readonly logger = new Logger(AiService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured in environment variables');
        }
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.log('AI Service initialized with Gemini API');
    }

    async generatePostits(
        files: string[]) {
        if (files.length === 0) {
            throw new Error('No files provided');
        }
        
        this.logger.log(`Processing ${files.length} files for postit generation`);
        
        const geminiFiles = await this.uploadFilesToGemini(this.ai, files)
        this.logger.log(`Successfully uploaded ${geminiFiles.length} files to Gemini`);

        const systemInstruction = fs.readFileSync(
            "./src/ai/resources/prompts/prompt_mandala_inicial.txt",
            "utf-8"
          );
        this.logger.log('Loaded system instruction from prompt file');

        const model = this.configService.get<string>('GEMINI_MODEL');
        if (!model) {
            throw new Error('GEMINI_MODEL is not configured in environment variables');
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

    async uploadFilesToGemini(ai: GoogleGenAI, files: string[]) {
        this.logger.log(`Starting upload of ${files.length} files to Gemini`);
        const uploadedFiles = await Promise.all(
          files.map(async (filePath) => {
            this.logger.debug(`Uploading file: ${filePath}`);
            return ai.files.upload({
              file: filePath,
            });
          })
        );
        this.logger.log('All files uploaded successfully');
        return uploadedFiles;
      }
}
