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
   * @returns An array of Postit objects
   */
  async generatePostits(projectId: string): Promise<Postit[]> {
    this.logger.log(
      `Delegating postit generation to AI provider for project ${projectId}`,
    );
    return this.aiProvider.generatePostits(projectId);
  }
}
