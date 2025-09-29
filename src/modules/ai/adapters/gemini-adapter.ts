import { GoogleGenAI } from '@google/genai';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  createPostitsSummaryResponseSchema,
  createPostitsResponseSchema,
  createProvocationsResponseSchema,
} from '../resources/dto/generate-postits.dto';
import { createQuestionsResponseSchema } from '../resources/dto/generate-questions.dto';
import { createMandalaSummaryResponseSchema } from '../resources/dto/generate-summary.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiRequestValidationService } from '../services/ai-request-validation.service';
import {
  AiResponseWithUsage,
  AiUsageInfo,
} from '../types/ai-response-with-usage.type';

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
export class GeminiAdapter implements AiProvider {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiAdapter.name);
  private readonly geminiModel: string;
  constructor(
    private configService: ConfigService,
    private readonly validator: AiRequestValidationService,
    private readonly utilsService: AiAdapterUtilsService,
    private readonly promptBuilderService: AiPromptBuilderService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.geminiModel = this.utilsService.validateConfiguration('GEMINI_MODEL');
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

  /**
   * Convierte el usageMetadata de Gemini a nuestro formato
   */
  private parseUsageMetadata(usageMetadata: GeminiUsageMetadata): AiUsageInfo {
    return {
      totalTokens: usageMetadata?.totalTokenCount || 0,
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
    };
  }

  private async generateContentWithFiles(
    model: string,
    systemInstruction: string,
    geminiFiles: GeminiUploadedFile[],
    responseSchema: unknown,
    promptTask?: string,
  ): Promise<{ text: string | undefined; usage: AiUsageInfo }> {
    this.logger.debug('Preparing Gemini API request...');

    const config = {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      systemInstruction: systemInstruction,
    };

    const contents = geminiFiles.map((file: GeminiUploadedFile) => ({
      role: 'user',
      content: promptTask,
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

    const usage = this.parseUsageMetadata(response.usageMetadata || {});
    this.logger.debug('Usage metadata', response.usageMetadata);
    this.logger.debug('Parsed usage info', usage);
    this.logger.debug('Response text', response.text);

    return { text: response.text, usage };
  }

  async generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiResponseWithUsage<AiPostitResponse[]>> {
    const model = this.geminiModel;
    const finalPromptTask = await this.promptBuilderService.buildPostitPrompt(
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
    );

    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      selectedFiles,
      mandalaId,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const response = await this.generateContentWithFiles(
      model,
      finalPromptTask,
      geminiFiles,
      createPostitsResponseSchema({
        minItems: this.utilsService.getMinPostits(),
        maxItems: this.utilsService.getMaxPostits(),
      }),
    );

    const result = this.parseAndValidatePostitResponse(response.text);
    this.logger.log(`Postit generation completed for project: ${projectId}`);

    return {
      data: result,
      usage: response.usage,
    };
  }

  private parseAndValidatePostitResponse(
    responseText: string | undefined,
  ): AiPostitResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      // Normalize legacy key names from the AI response
      const normalizedResponseText = responseText.replace(
        /"scale"\s*:/g,
        '"section":',
      );
      const postits = JSON.parse(normalizedResponseText) as AiPostitResponse[];
      this.logger.log(
        `Successfully parsed ${postits.length} postits from AI response`,
      );

      const config = this.validator.getConfig();
      if (postits.length > config.maxPostitsPerRequest) {
        this.logger.error(`Generated postits count exceeds limit`, {
          generatedCount: postits.length,
          maxAllowed: config.maxPostitsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException([
          `Generated ${postits.length} postits, but maximum allowed is ${config.maxPostitsPerRequest}`,
        ]);
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
    dimensions: string[],
    scales: string[],
    tags: string[],
    mandalaAiSummary: string,
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiQuestionResponse[]>> {
    this.logger.log(`Starting question generation for project: ${projectId}`);

    const model = this.geminiModel;
    const finalPromptTask = await this.promptBuilderService.buildQuestionPrompt(
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
      mandalaAiSummary,
    );
    const fileBuffers = await this.utilsService.loadAndValidateFiles(
      projectId,
      selectedFiles,
      mandalaId,
    );

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const response = await this.generateContentWithFiles(
      model,
      finalPromptTask,
      geminiFiles,
      createQuestionsResponseSchema({
        minItems: this.utilsService.getMinQuestions(),
        maxItems: this.utilsService.getMaxQuestions(),
      }),
    );

    const result = this.parseAndValidateQuestionResponse(response.text);
    this.logger.log(`Question generation completed for project: ${projectId}`);

    return {
      data: result,
      usage: response.usage,
    };
  }

  private parseAndValidateQuestionResponse(
    responseText: string | undefined,
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
          generatedCount: questions.length,
          maxAllowed: config.maxQuestionsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException([
          `Generated ${questions.length} questions, but maximum allowed is ${config.maxQuestionsPerRequest}`,
        ]);
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

  async generatePostitsSummary(
    projectId: string,
    dimensions: string[],
    scales: string[],
    mandalasAiSummary: string,
  ): Promise<
    AiResponseWithUsage<{
      comparisons: AiPostitComparisonResponse[];
      report: AiMandalaReport;
    }>
  > {
    this.logger.log(`Starting question generation for project: ${projectId}`);

    const model = this.geminiModel;
    const finalPromptTask =
      await this.promptBuilderService.buildPostitSummaryPrompt(
        mandalasAiSummary,
      );

    const fileBuffers = await this.utilsService.loadAndValidateFiles(projectId);

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const response = await this.generateContentWithFiles(
      model,
      finalPromptTask,
      geminiFiles,
      createPostitsSummaryResponseSchema({
        minItems: this.utilsService.getMinResults(),
        maxItems: this.utilsService.getMaxResults(),
      }),
    );

    const { comparisons, report } = this.parseAndValidateComparisonWithReport(
      response.text,
    );

    this.logger.log(`Comparison + report generation completed`);
    this.logger.debug(
      '[AI REPORT][comparativa] ' + JSON.stringify(report, null, 2),
    );

    return {
      data: { comparisons, report },
      usage: response.usage,
    };
  }

  private parseAndValidateComparisonResponse(
    responseText: string | undefined,
  ): AiPostitComparisonResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const normalizedResponseText = responseText.replace(
        /"scale"\s*:/g,
        '"section":',
      );
      const comparisons = JSON.parse(
        normalizedResponseText,
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

  async generateProvocations(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasAiSummary: string,
    mandalasSummariesWithAi: string,
    _selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiProvocationResponse[]>> {
    this.logger.log(
      `Starting provocations generation for project: ${projectId}`,
    );

    const model = this.geminiModel;
    const finalPromptTask =
      await this.promptBuilderService.buildProvocationPrompt(
        projectName,
        projectDescription,
        mandalasAiSummary,
        mandalasSummariesWithAi,
      );

    const fileBuffers = await this.utilsService.loadAndValidateFiles(projectId);

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);
    const response = await this.generateContentWithFiles(
      model,
      finalPromptTask,
      geminiFiles,
      createProvocationsResponseSchema({
        minItems: this.utilsService.getMinProvocations(),
        maxItems: this.utilsService.getMaxProvocations(),
      }),
    );

    const result = this.parseAndValidateProvocationResponse(response.text);
    this.logger.log(`Provocations generation completed`);

    return {
      data: result,
      usage: response.usage,
    };
  }

  private parseAndValidateProvocationResponse(
    responseText: string | undefined,
  ): AiProvocationResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const provocations = JSON.parse(responseText) as AiProvocationResponse[];
      this.logger.log(
        `Successfully parsed ${provocations.length} provocation responses from AI`,
      );

      return provocations;
    } catch (error) {
      this.logger.error(
        'Failed to parse AI provocation response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  private parseAndValidateComparisonWithReport(
    responseText: string | undefined,
  ): { comparisons: AiPostitComparisonResponse[]; report: AiMandalaReport } {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    interface GeminiComparisonWithReport {
      comparisons?: AiPostitComparisonResponse[];
      report?: Partial<AiMandalaReport>;
    }

    let parsed: GeminiComparisonWithReport;

    try {
      parsed = JSON.parse(responseText) as {
        comparisons?: AiPostitComparisonResponse[];
        report?: AiMandalaReport;
      };
    } catch {
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start < 0 || end < 0) {
        this.logger.error('Invalid JSON response from Gemini API');
        throw new Error('Invalid JSON response from Gemini API');
      }
      parsed = JSON.parse(
        responseText.slice(start, end + 1),
      ) as GeminiComparisonWithReport;
    }

    const normalizedComparisonsText = Array.isArray(parsed.comparisons)
      ? JSON.stringify(parsed.comparisons)
      : JSON.stringify([]);

    const comparisons = this.parseAndValidateComparisonResponse(
      normalizedComparisonsText,
    );

    const report: AiMandalaReport = {
      summary:
        parsed.report && typeof parsed.report.summary === 'string'
          ? parsed.report.summary
          : '',
      coincidences: parsed?.report?.coincidences ?? [],
      tensions: parsed?.report?.tensions ?? [],
      insights: parsed?.report?.insights ?? [],
    };

    return { comparisons, report };
  }

  async generateMandalaSummary(
    projectId: string,
    mandalaId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    cleanMandalaDocument: string,
  ): Promise<string> {
    this.logger.log(
      `Starting summary generation for mandala ${mandalaId} in project ${projectId}`,
    );

    const finalPromptTask =
      await this.promptBuilderService.buildMandalaSummaryPrompt(
        dimensions,
        scales,
        centerCharacter,
        centerCharacterDescription,
        cleanMandalaDocument,
      );

    const fileBuffers = await this.utilsService.loadAndValidateFiles(projectId);

    const geminiFiles = await this.uploadFilesToGemini(fileBuffers);

    const responseText = await this.generateContentWithFiles(
      this.geminiModel,
      finalPromptTask,
      geminiFiles,
      createMandalaSummaryResponseSchema(),
    );

    if (!responseText || !responseText.text) {
      throw new Error('No response text received from Gemini API');
    }

    this.logger.log(
      `Summary generation completed for mandala ${mandalaId} in project ${projectId}`,
    );

    return responseText.text;
  }
}
