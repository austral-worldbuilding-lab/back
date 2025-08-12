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

    this.logger.log('Configuration:', {
      dimensions: dimensions.length,
      scales: scales.length,
      centerCharacter,
      centerCharacterDescription,
      tags: tags.length,
    });

    return this.aiProvider.generatePostits(
      projectId,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      tags,
    );
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
    this.logger.log(`generateQuestions called for mandala ${mandalaId}`);

    // Transform raw mandala document into AI-readable summary
    const mandalaAiSummary = createMandalaAiSummary(mandala);

    // Generate formatted summary for better AI understanding with natural language
    const mandalaTextSummary = generateTextualSummary(mandalaAiSummary);

    return this.aiProvider.generateQuestions(
      projectId,
      mandalaId,
      mandalaTextSummary,
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
    );
  }
}
