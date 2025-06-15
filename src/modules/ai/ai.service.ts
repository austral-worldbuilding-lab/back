import { Injectable, Logger, Inject } from '@nestjs/common';
import { AiProvider } from './interfaces/ai-provider.interface';
import { AI_PROVIDER } from './factories/ai-provider.factory';
import { Postit } from '@modules/mandala/types/postits';

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
   * @returns An array of Postit objects
   */
  async generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
  ): Promise<Postit[]> {
    const finalDimensions = dimensions;
    const finalScales = scales;
    const finalCenterCharacter = centerCharacter;
    const finalCenterCharacterDescription = centerCharacterDescription;
    const finalTags = tags;

    this.logger.log(
      `Delegating postit generation to AI provider for project ${projectId}`,
    );
    this.logger.log(
      `Configuration: ${finalDimensions.length} dimensions, ${finalScales.length} scales ${dimensions ? '(user-provided)' : '(defaults)'}, center character: ${finalCenterCharacter} ${finalCenterCharacterDescription}, ${finalTags.length} tags`,
    );
    return this.aiProvider.generatePostits(
      projectId,
      finalDimensions,
      finalScales,
      finalCenterCharacter,
      finalCenterCharacterDescription,
      finalTags,
    );
  }
}
