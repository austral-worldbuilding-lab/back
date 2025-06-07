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
   * @param dimensions - Optional array of dimensions. If not provided, uses defaults
   * @param scales - Optional array of scales. If not provided, uses defaults
   * @returns An array of Postit objects
   */
  async generatePostits(
    projectId: string,
    dimensions?: string[],
    scales?: string[],
  ): Promise<Postit[]> {
    const finalDimensions = dimensions || this.defaultDimensions;
    const finalScales = scales || this.defaultScales;

    this.logger.log(
      `Delegating postit generation to AI provider for project ${projectId}`,
    );
    this.logger.log(
      `Using ${finalDimensions.length} dimensions and ${finalScales.length} scales ${dimensions ? '(user-provided)' : '(defaults)'}`,
    );

    return this.aiProvider.generatePostits(
      projectId,
      finalDimensions,
      finalScales,
    );
  }
}
