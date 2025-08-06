import { AiPostitResponse } from '@modules/mandala/types/postits';
import { Injectable, Logger, Inject } from '@nestjs/common';

import { AI_PROVIDER } from './factories/ai-provider.factory';
import { AiProvider } from './interfaces/ai-provider.interface';

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
}
