import { AppLogger } from '@common/services/logger.service';
import { ConsumptionService } from '@modules/consumption/consumption.service';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';
import { Injectable, Inject } from '@nestjs/common';
import { AiService as AiServiceEnum, AiModel } from '@prisma/client';

import { FirestoreMandalaDocument } from '../firebase/types/firestore-character.type';
import { MandalaDto } from '../mandala/dto/mandala.dto';

import { AI_PROVIDER } from './factories/ai-provider.factory';
import { AiProvider } from './interfaces/ai-provider.interface';
import { AiEncyclopediaResponse } from './types/ai-encyclopedia-response.type';
import {
  createCleanMandalaForQuestions,
  createCleanMandalaForSummary,
} from './utils/mandala-cleaned-for-ai.util';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER) private aiProvider: AiProvider,
    private readonly consumptionService: ConsumptionService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AiService.name);
    this.logger.log(
      `AI Service initialized with ${this.aiProvider.constructor.name}`,
    );
  }

  async generatePostits(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
    selectedFiles?: string[],
    mandalaId?: string,
    userId?: string,
    organizationId?: string,
  ): Promise<AiPostitResponse[]> {
    this.logger.log(`Starting postit generation for project: ${projectId}`);

    const response = await this.aiProvider.generatePostits(
      projectId,
      projectName,
      projectDescription,
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
      selectedFiles,
      mandalaId,
    );

    // Trackear consumo de IA
    if (userId) {
      await this.consumptionService.trackAiUsage(
        userId,
        AiServiceEnum.GENERATE_POSTITS,
        AiModel.GEMINI_25_FLASH,
        response.usage.totalTokens,
        projectId,
        organizationId,
      );

      this.logger.log(
        `Tracked AI usage: ${response.usage.totalTokens} tokens for user ${userId}`,
      );
    }

    this.logger.log(
      `Generated ${response.data.length} postits for project: ${projectId}`,
    );
    return response.data;
  }

  async generateContextPostits(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerContext: string,
    centerContextDescription: string,
    tags: string[],
    selectedFiles?: string[],
    mandalaId?: string,
    userId?: string,
    organizationId?: string,
  ): Promise<AiPostitResponse[]> {
    this.logger.log(
      `Starting context postit generation for project: ${projectId}`,
    );

    const response = await this.aiProvider.generateContextPostits(
      projectId,
      projectName,
      projectDescription,
      dimensions,
      scales,
      tags,
      centerContext,
      centerContextDescription,
      selectedFiles,
      mandalaId,
    );

    // Trackear consumo de IA
    if (userId) {
      await this.consumptionService.trackAiUsage(
        userId,
        AiServiceEnum.GENERATE_POSTITS,
        AiModel.GEMINI_25_FLASH,
        response.usage.totalTokens,
        projectId,
        organizationId,
      );

      this.logger.log(
        `Tracked AI usage: ${response.usage.totalTokens} tokens for user ${userId}`,
      );
    }

    this.logger.log(
      `Generated ${response.data.length} context postits for project: ${projectId}`,
    );
    return response.data;
  }

  async generateQuestions(
    projectId: string,
    projectName: string,
    projectDescription: string,
    mandalaId: string,
    mandala: FirestoreMandalaDocument,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
    userId?: string,
    organizationId?: string,
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`Starting question generation for project: ${projectId}`, {
      dimensions: dimensions.length,
      scales: scales.length,
      tags: tags.length,
      centerCharacter,
      centerCharacterDescription,
    });

    const cleanMandalaDocument = createCleanMandalaForQuestions(mandala);

    const response = await this.aiProvider.generateQuestions(
      projectId,
      projectName,
      projectDescription,
      mandalaId,
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
      JSON.stringify(cleanMandalaDocument),
      selectedFiles,
    );

    // Trackear consumo de IA
    if (userId) {
      await this.consumptionService.trackAiUsage(
        userId,
        AiServiceEnum.GENERATE_QUESTIONS,
        AiModel.GEMINI_25_FLASH,
        response.usage.totalTokens,
        projectId,
        organizationId,
      );

      this.logger.log(
        `Tracked AI usage: ${response.usage.totalTokens} tokens for user ${userId}`,
      );
    }

    this.logger.log(
      `Generated ${response.data.length} questions for project: ${projectId}`,
    );
    return response.data;
  }

  async generatePostitsSummary(
    projectId: string,
    projectName: string,
    projectDescription: string,
    mandalas: MandalaDto[],
    mandalasDocument: FirestoreMandalaDocument[],
    userId?: string,
    organizationId?: string,
  ): Promise<{
    comparisons: AiPostitComparisonResponse[];
    report: AiMandalaReport;
  }> {
    this.logger.log(
      `Starting postit summary generation for project: ${projectId}`,
    );
    const allDimensions = mandalas.flatMap((m) =>
      m.configuration.dimensions.map((d) => d.name),
    );
    const allScales = mandalas.flatMap((m) => m.configuration.scales);

    const cleanMandalasDocument = mandalasDocument.map((m) =>
      createCleanMandalaForSummary(m),
    );

    const response = await this.aiProvider.generatePostitsSummary(
      projectId,
      projectName,
      projectDescription,
      allDimensions,
      allScales,
      cleanMandalasDocument.map((m) => JSON.stringify(m)).join('\n'),
    );

    // Trackear consumo de IA
    if (userId) {
      await this.consumptionService.trackAiUsage(
        userId,
        AiServiceEnum.GENERATE_ENCYCLOPEDIA,
        AiModel.GEMINI_25_FLASH,
        response.usage.totalTokens,
        projectId,
        organizationId,
      );

      this.logger.log(
        `Tracked AI usage: ${response.usage.totalTokens} tokens for user ${userId}`,
      );
    }

    this.logger.log(
      `Generated ${response.data.comparisons.length} postits summary for project: ${projectId}`,
    );

    return response.data;
  }

  async generateProvocations(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasDocument: FirestoreMandalaDocument[],
    mandalasSummariesWithAi: string,
    selectedFiles?: string[],
    userId?: string,
    organizationId?: string,
  ): Promise<AiProvocationResponse[]> {
    this.logger.log(
      `Starting provocations generation for project: ${projectId}`,
    );

    const cleanMandalasDocument = mandalasDocument.map((m) =>
      createCleanMandalaForSummary(m),
    );

    const response = await this.aiProvider.generateProvocations(
      projectId,
      projectName,
      projectDescription,
      dimensions,
      scales,
      cleanMandalasDocument.map((m) => JSON.stringify(m)).join('\n'),
      mandalasSummariesWithAi,
      selectedFiles,
    );

    // Trackear consumo de IA
    if (userId) {
      await this.consumptionService.trackAiUsage(
        userId,
        AiServiceEnum.GENERATE_PROVOCATIONS,
        AiModel.GEMINI_25_FLASH,
        response.usage.totalTokens,
        projectId,
        organizationId,
      );

      this.logger.log(
        `Tracked AI usage: ${response.usage.totalTokens} tokens for user ${userId}`,
      );
    }

    this.logger.log(
      `Generated ${response.data.length} provocations for project: ${projectId}`,
    );

    return response.data;
  }

  async generateMandalaSummary(
    projectId: string,
    mandala: MandalaDto,
    mandalaDocument: FirestoreMandalaDocument,
  ): Promise<string> {
    this.logger.log(
      `Starting mandala summary generation for project: ${projectId}`,
    );

    const cleanMandalaDocument = createCleanMandalaForSummary(mandalaDocument);

    const dimensions = mandala.configuration.dimensions.map((d) => d.name);
    const scales = mandala.configuration.scales;
    const centerCharacter = mandala.configuration.center.name;
    const centerCharacterDescription =
      mandala.configuration.center.description || 'No description';

    const summary = await this.aiProvider.generateMandalaSummary(
      projectId,
      mandala.id,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      JSON.stringify(cleanMandalaDocument),
    );

    this.logger.log(`Summary report generated for mandala ${mandala.id}`);

    return summary;
  }

  async generateEncyclopedia(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasSummariesWithAi: string,
    selectedFiles?: string[],
    userId?: string,
    organizationId?: string,
  ): Promise<AiEncyclopediaResponse> {
    this.logger.log(
      `Starting encyclopedia generation for project: ${projectId}`,
    );

    const response = await this.aiProvider.generateEncyclopedia(
      projectId,
      projectName,
      projectDescription,
      dimensions,
      scales,
      mandalasSummariesWithAi,
      selectedFiles,
    );

    // Trackear consumo de IA
    if (userId) {
      await this.consumptionService.trackAiUsage(
        userId,
        AiServiceEnum.GENERATE_ENCYCLOPEDIA,
        AiModel.GEMINI_25_FLASH,
        response.usage.totalTokens,
        projectId,
        organizationId,
      );

      this.logger.log(
        `Tracked AI usage: ${response.usage.totalTokens} tokens for user ${userId}`,
      );
    }

    this.logger.log(
      `Encyclopedia generation completed for project: ${projectId}`,
    );

    return response.data;
  }
}
