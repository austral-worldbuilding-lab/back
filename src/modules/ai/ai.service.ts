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
import {
  createMandalaAiSummary,
  generateTextualSummary,
} from './utils/mandala-summary.util';

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
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiPostitResponse[]> {
    this.logger.log(`Starting postit generation for project: ${projectId}`);

    this.logger.debug('Postit generation configuration:', {
      dimensions: dimensions.length,
      scales: scales.length,
      centerCharacter,
      centerCharacterDescription,
      tags: tags.length,
    });

    const result = await this.aiProvider.generatePostits(
      projectId,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
      selectedFiles,
      mandalaId,
    );

    this.logger.log(
      `Generated ${result.length} postits for project: ${projectId}`,
    );
    return result;
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
    selectedFiles?: string[],
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`Starting question generation for mandala: ${mandalaId}`);

    // Transform raw mandala document into AI-readable summary
    const mandalaAiSummary = createMandalaAiSummary(mandala);

    this.logger.debug('Mandala summary created:', {
      totalPostits: mandalaAiSummary.totalPostits,
      dimensions: mandalaAiSummary.dimensions.length,
      sections: mandalaAiSummary.sections.length,
      centerCharacter: mandalaAiSummary.centerCharacter.name,
    });

    // Generate formatted summary for better AI understanding with natural language
    const mandalaTextSummary = generateTextualSummary(mandalaAiSummary);

    this.logger.debug(
      'Generated text summary length:',
      mandalaTextSummary.length,
    );

    const result = await this.aiProvider.generateQuestions(
      projectId,
      mandalaId,
      mandalaTextSummary,
      dimensions,
      scales,
      tags,
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

    const allDimensions = mandalas.flatMap((m) =>
      m.configuration.dimensions.map((d) => d.name),
    );
    const allScales = mandalas.flatMap((m) => m.configuration.scales);

    const mandalasAiSummary = mandalasDocument.map((m) =>
      createMandalaAiSummary(m),
    );

    const result = await this.aiProvider.generatePostitsComparison(
      projectId,
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
