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
   * @returns An array of Postit objects
   */
  async generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
  ): Promise<Postit[]> {
    const finalDimensions = dimensions;
    const finalScales = scales;
    const finalCenterCharacter = centerCharacter;
    const finalCenterCharacterDescription = centerCharacterDescription;

    this.logger.log(
      `Delegating postit generation to AI provider for project ${projectId}`,
    );
    this.logger.log(
      `Using ${finalDimensions.length} dimensions and ${finalScales.length} scales ${dimensions ? '(user-provided)' : '(defaults)'}`,
    );
    this.logger.log(`Using center character: ${finalCenterCharacter}`);
    this.logger.log(
      `Using center character description: ${finalCenterCharacterDescription}`,
    );
    return this.aiProvider.generatePostits(
      projectId,
      finalDimensions,
      finalScales,
      finalCenterCharacter,
      finalCenterCharacterDescription,
    );
  }
}
