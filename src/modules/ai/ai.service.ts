import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
  PostitWithCoordinates,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';
import { Injectable, Logger, Inject } from '@nestjs/common';

import { FirestoreMandalaDocument } from '../firebase/types/firestore-character.type';
import { MandalaDto } from '../mandala/dto/mandala.dto';

import { AI_PROVIDER } from './factories/ai-provider.factory';
import { AiProvider } from './interfaces/ai-provider.interface';
import {
  createCleanMandalaForQuestions,
  createCleanMandalaForSummary,
} from './utils/mandala-cleaned-for-ai.util';

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

    const result = await this.aiProvider.generatePostits(
      projectId,
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
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
    this.logger.log(`Starting question generation for project: ${projectId}`, {
      dimensions: dimensions.length,
      scales: scales.length,
      tags: tags.length,
      centerCharacter,
      centerCharacterDescription,
    });

    const cleanMandalaDocument = createCleanMandalaForQuestions(mandala);

    const result = await this.aiProvider.generateQuestions(
      projectId,
      mandalaId,
      dimensions,
      scales,
      tags,
      centerCharacter,
      centerCharacterDescription,
      JSON.stringify(cleanMandalaDocument),
      selectedFiles,
    );

    this.logger.log(
      `Generated ${result.length} questions for project: ${projectId}`,
    );
    return result;
  }

  async generatePostitsSummary(
    projectId: string,
    mandalas: MandalaDto[],
    mandalasDocument: FirestoreMandalaDocument[],
  ): Promise<{
    comparisons: AiPostitComparisonResponse[];
    report: AiMandalaReport;
  }> {
    this.logger.log(
      `Starting postit summary generation for project: ${projectId}`,
    );
    const allDimensions = mandalas.flatMap((m) =>
      m.configuration.dimensions.map((d) => d.name),
    );
    const allScales = mandalas.flatMap((m) => m.configuration.scales);

    const cleanMandalasDocument = mandalasDocument.map((m) =>
      createCleanMandalaForSummary(m),
    );

    const result = await this.aiProvider.generatePostitsSummary(
      projectId,
      allDimensions,
      allScales,
      cleanMandalasDocument.map((m) => JSON.stringify(m)).join('\n'),
    );

    this.logger.log(
      `Generated ${result.comparisons.length} postits summary for project: ${projectId}`,
    );

    return result;
  }

  async generateProvocations(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasDocument: FirestoreMandalaDocument[],
    selectedFiles?: string[],
  ): Promise<AiProvocationResponse[]> {
    this.logger.log(
      `Starting provocations generation for project: ${projectId}`,
    );

    const cleanMandalasDocument = mandalasDocument.map((m) =>
      createCleanMandalaForSummary(m),
    );

    const result = await this.aiProvider.generateProvocations(
      projectId,
      projectName,
      projectDescription,
      dimensions,
      scales,
      cleanMandalasDocument.map((m) => JSON.stringify(m)).join('\n'),
      selectedFiles,
    );

    this.logger.log(
      `Generated ${result.length} provocations for project: ${projectId}`,
    );

    return result;
  }

  async generateMandalaSummary(
    projectId: string,
    mandala: MandalaDto,
    mandalaDocument: FirestoreMandalaDocument,
  ): Promise<string> {
    this.logger.log(
      `Starting mandala summary generation for project: ${projectId}`,
    );

    const cleanMandalaDocument = createCleanMandalaForSummary(mandalaDocument);

    const dimensions = mandala.configuration.dimensions.map((d) => d.name);
    const scales = mandala.configuration.scales;
    const centerCharacter = mandala.configuration.center.name;
    const centerCharacterDescription =
      mandala.configuration.center.description || 'No description';

    const summary = await this.aiProvider.generateMandalaSummary(
      projectId,
      mandala.id,
      dimensions,
      scales,
      centerCharacter,
      centerCharacterDescription,
      JSON.stringify(cleanMandalaDocument),
    );

    this.logger.log(`Summary report generated for mandala ${mandala.id}`);

    return summary;
  }
}
