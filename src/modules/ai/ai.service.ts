import { AiPostitResponse } from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions';
import { Injectable, Logger, Inject } from '@nestjs/common';

import { FirestoreMandalaDocument } from '../firebase/types/firestore-character.type';

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

  /**
   * Generates postits for a project
   * @param projectId - The ID of the project to generate postits for
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerCharacter
   * @param centerCharacterDescription
   * @param tags - Array of tags for connecting postits across dimensions
   * @returns An array of AiPostitResponse objects
   */
  async generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
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
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`Starting question generation for mandala: ${mandalaId}`);

    // Transform raw mandala document into AI-readable summary
    const mandalaAiSummary = createMandalaAiSummary(mandala);

    this.logger.debug('Mandala summary created:', {
      totalPostits: mandalaAiSummary.totalPostits,
      dimensions: mandalaAiSummary.dimensions.length,
      scales: mandalaAiSummary.scales.length,
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
    );
    this.logger.log(mandalaTextSummary);
    this.logger.log(
      `Generated ${result.length} questions for mandala: ${mandalaId}`,
    );
    return result;
  }
}
