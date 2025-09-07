import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions';
import { Injectable, Logger, Inject } from '@nestjs/common';

import { FirestoreMandalaDocument } from '../firebase/types/firestore-character.type';
import { MandalaDto } from '../mandala/dto/mandala.dto';

import { AI_PROVIDER } from './factories/ai-provider.factory';
import { AiProvider } from './interfaces/ai-provider.interface';
import { createMandalaAiSummaryForQuestions } from './utils/mandala-questions-summary.util';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(AI_PROVIDER) private aiProvider: AiProvider) {
    this.logger.log(
      `AI Service initialized with ${this.aiProvider.constructor.name}`,
    );
  }

  async generatePostits(
    projectId: string,
    mandalaId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
    selectedFiles?: string[],
  ): Promise<AiPostitResponse[]> {
    this.logger.log(`Starting postit generation for mandala: ${mandalaId}`, {
      centerCharacter,
      centerCharacterDescription,
      dimensions: dimensions.length,
      scales: scales.length,
      tags: tags.length,
    });

    const result = await this.aiProvider.generatePostits(
      projectId,
      mandalaId,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
      selectedFiles,
    );

    this.logger.log(
      `Generated ${result.length} postits for mandala: ${mandalaId}`,
    );
    return result;
  }

  async generateQuestions(
    projectId: string,
    mandalaId: string,
    mandala: FirestoreMandalaDocument,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`Starting question generation for mandala: ${mandalaId}`, {
      dimensions: dimensions.length,
      scales: scales.length,
      centerCharacter,
      centerCharacterDescription,
    });

    const mandalaAiSummary = createMandalaAiSummaryForQuestions(mandala);

    this.logger.debug('Mandala summary for questions created:', {
      totalPostits: mandalaAiSummary.totalPostits,
      dimensions: mandalaAiSummary.dimensions.length,
      sections: mandalaAiSummary.sections.length,
      centerCharacter: mandalaAiSummary.centerCharacter.name,
    });

    const result = await this.aiProvider.generateQuestions(
      projectId,
      mandalaId,
      JSON.stringify(mandalaAiSummary),
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      selectedFiles,
    );

    this.logger.log(
      `Generated ${result.length} questions for mandala: ${mandalaId}`,
    );
    return result;
  }

  async generatePostitsSummary(
    projectId: string,
    mandalas: MandalaDto[],
    mandalasDocument: FirestoreMandalaDocument[],
  ): Promise<AiPostitComparisonResponse[]> {
    this.logger.log(
      `Starting postit summary generation for mandalas: ${mandalas.map((m) => m.id).join(', ')}`,
    );
    const mandalaIds = mandalas.map((m) => m.id);

    const allDimensions = mandalas.flatMap((m) =>
      m.configuration.dimensions.map((d) => d.name),
    );
    const allScales = mandalas.flatMap((m) => m.configuration.scales);

    const mandalasAiSummary = mandalasDocument.map((m) =>
      createMandalaAiSummaryForQuestions(m),
    );

    const result = await this.aiProvider.generatePostitsSummary(
      projectId,
      mandalaIds,
      allDimensions,
      allScales,
      mandalasAiSummary.map((m) => JSON.stringify(m)).join('\n'),
    );

    this.logger.log(
      `Generated ${result.length} postits summary for mandalas: ${mandalas.map((m) => m.id).join(', ')}`,
    );

    return result;
  }
}
