import { AppLogger } from '@common/services/logger.service';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';
import { AiSolutionResponse } from '@modules/solution/types/solutions.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiGenerationEngine } from '../services/ai-generation-engine.interface';
import { AiStrategyRegistryService } from '../services/ai-strategy-registry.service';
import { ContextPostitsInput } from '../strategies/context-postits.strategy';
import { MandalaImagesInput } from '../strategies/mandala-images.strategy';
import { MandalaSummaryInput } from '../strategies/mandala-summary.strategy';
import { PostitsSummaryInput } from '../strategies/postits-summary.strategy';
import { PostitsInput } from '../strategies/postits.strategy';
import { ProvocationsInput } from '../strategies/provocations.strategy';
import { QuestionsInput } from '../strategies/questions.strategy';
import { SolutionsInput } from '../strategies/solutions.strategy';
import { AiEncyclopediaResponse } from '../types/ai-encyclopedia-response.type';
import { AiResponseWithUsage } from '../types/ai-response-with-usage.type';

import { AiMandalaImageResponse } from '@/modules/mandala/types/mandala-images.type';

@Injectable()
export class GeminiAdapter implements AiProvider {
  private readonly geminiTextModel: string;
  private readonly geminiImageModel: string;

  constructor(
    private configService: ConfigService,
    private readonly engine: AiGenerationEngine,
    private readonly strategies: AiStrategyRegistryService,
    private readonly logger: AppLogger,
  ) {
    const text_model = this.configService.get<string>('GEMINI_MODEL');
    const image_model = this.configService.get<string>('GEMINI_IMAGE_MODEL');
    if (!text_model) {
      throw new Error(
        'GEMINI_MODEL is not configured in environment variables',
      );
    }
    this.geminiTextModel = text_model;
    if (!image_model) {
      throw new Error(
        'GEMINI_IMAGE_MODEL is not configured in environment variables',
      );
    }
    this.geminiImageModel = image_model;
  }

  async generatePostits(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiResponseWithUsage<AiPostitResponse[]>> {
    const strategy = this.strategies.getPostits();
    const input: PostitsInput = {
      projectName,
      projectDescription,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
    };
    const prompt = await strategy.buildPrompt(input);
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId, selectedFiles, mandalaId },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(`Postit generation completed for project: ${projectId}`);
    return { data, usage };
  }

  async generateContextPostits(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerContext: string,
    centerContextDescription: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiResponseWithUsage<AiPostitResponse[]>> {
    const strategy = this.strategies.getContextPostits();
    const input: ContextPostitsInput = {
      projectName,
      projectDescription,
      dimensions,
      scales,
      centerContext,
      centerContextDescription,
      tags,
    };
    const prompt = await strategy.buildPrompt(input);
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId, selectedFiles, mandalaId },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(
      `Context postit generation completed for project: ${projectId}`,
    );
    return { data, usage };
  }

  async generateQuestions(
    projectId: string,
    projectName: string,
    projectDescription: string,
    mandalaId: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaAiSummary: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiQuestionResponse[]>> {
    this.logger.log(`Starting question generation for project: ${projectId}`);
    const strategy = this.strategies.getQuestions();
    const input: QuestionsInput = {
      projectName,
      projectDescription,
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
      mandalaAiSummary,
    };
    const prompt = await strategy.buildPrompt(input);
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId, selectedFiles, mandalaId },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(`Question generation completed for project: ${projectId}`);
    return { data, usage };
  }

  async generatePostitsSummary(
    projectId: string,
    projectName: string,
    projectDescription: string,
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
    const strategy = this.strategies.getPostitsSummary();
    const input: PostitsSummaryInput = {
      projectName,
      projectDescription,
      mandalasAiSummary,
    };
    const prompt = await strategy.buildPrompt(input);
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(`Comparison + report generation completed`);
    return { data, usage };
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
    const strategy = this.strategies.getProvocations();
    const input: ProvocationsInput = {
      projectName,
      projectDescription,
      mandalasAiSummary,
      mandalasSummariesWithAi,
    };
    const prompt = await strategy.buildPrompt(input);
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(`Provocations generation completed`);
    return { data, usage };
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
    const strategy = this.strategies.getMandalaSummary();
    const input: MandalaSummaryInput = {
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      cleanMandalaDocument,
    };
    return (async () => {
      const prompt = await strategy.buildPrompt(input);
      const schema = strategy.getResponseSchema();
      const { text } = await this.engine.runTextGeneration(
        this.geminiTextModel,
        prompt,
        schema,
        {
          projectId,
        },
      );
      const data = strategy.parseAndValidate(text);
      this.logger.log(
        `Summary generation completed for mandala ${mandalaId} in project ${projectId}`,
      );
      return data;
    })();
  }

  async generateEncyclopedia(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasSummariesWithAi: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiEncyclopediaResponse>> {
    this.logger.log(
      `Starting encyclopedia generation for project: ${projectId}`,
    );
    const strategy = this.strategies.getEncyclopedia();
    const prompt = await strategy.buildPrompt({
      projectName,
      projectDescription,
      dimensions,
      scales,
      mandalasSummariesWithAi,
    });
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId, selectedFiles },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(
      `Encyclopedia generation completed for project: ${projectId}`,
    );
    return { data, usage };
  }

  async generateSolutions(
    projectId: string,
    projectName: string,
    projectDescription: string,
    encyclopedia: string,
  ): Promise<AiResponseWithUsage<AiSolutionResponse[]>> {
    this.logger.log(`Starting solutions generation for project: ${projectId}`);
    const strategy = this.strategies.getSolutions();
    const input: SolutionsInput = {
      projectName,
      projectDescription,
      encyclopedia,
    };
    const prompt = await strategy.buildPrompt(input);
    const schema = strategy.getResponseSchema();
    const { text, usage } = await this.engine.runTextGeneration(
      this.geminiTextModel,
      prompt,
      schema,
      { projectId },
    );
    const data = strategy.parseAndValidate(text);
    this.logger.log(`Solutions generation completed for project: ${projectId}`);
    return { data, usage };
  }

  async generateMandalaImages(
    projectId: string,
    mandalaId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaDocument: string,
  ): Promise<AiResponseWithUsage<AiMandalaImageResponse[]>> {
    this.logger.log(
      `Starting mandala images generation for mandala: ${mandalaId}`,
    );
    const strategy = this.strategies.getMandalaImages();
    const input: MandalaImagesInput = {
      projectName,
      projectDescription,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      mandalaDocument,
    };
    const prompt = await strategy.buildPrompt(input);
    //const schema = strategy.getResponseSchema();

    const { data, usage } = await this.engine.runImageGeneration(
      this.geminiImageModel,
      prompt,
      { projectId, mandalaId },
    );
    this.logger.log(
      `Mandala images generation completed for mandala: ${mandalaId}`,
    );
    return { data, usage };
  }
}
