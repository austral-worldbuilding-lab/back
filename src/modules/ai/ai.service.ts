import { Injectable, Logger, Inject } from '@nestjs/common';
import { AiProvider } from './interfaces/ai-provider.interface';
import { AI_PROVIDER } from './factories/ai-provider.factory';
import { Postit } from '@modules/mandala/types/postits';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  //TODO: cambiar el uso de defaultDimensions y defaultScales por las que carga el usuario en el proyecto
  private readonly defaultDimensions = [
    'Recursos',
    'Cultura',
    'Infraestructura',
    'Economía',
    'Gobierno',
    'Ecología',
  ];
  private readonly defaultScales = ['Persona', 'Comunidad', 'Institución'];

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
    return this.aiProvider.generatePostits(
      projectId,
      this.defaultDimensions,
      this.defaultScales,
    );
  }
}
