import { AppLogger } from '@common/services/logger.service';
import { Injectable } from '@nestjs/common';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiRequestValidationService } from '../services/ai-request-validation.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface SolutionImageResponse {
  id: string;
  imageData: string;
}

export interface SolutionImagesInput {
  projectId: string;
  projectName: string;
  projectDescription: string;
  solutionId: string;
  solutionTitle: string;
  solutionSummary: string;
}

@Injectable()
export class SolutionImagesStrategy
  implements AiGenerationStrategy<SolutionImagesInput, SolutionImageResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly validator: AiRequestValidationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SolutionImagesStrategy.name);
  }

  async buildPrompt(input: SolutionImagesInput): Promise<string> {
    return this.promptBuilder.buildSolutionImagesPrompt(
      input.projectId,
      input.projectName,
      input.projectDescription,
      input.solutionId,
      input.solutionTitle,
      input.solutionSummary,
    );
  }

  getResponseSchema(): unknown {
    return null;
  }

  parseAndValidate(responseText: string | undefined): SolutionImageResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const images = JSON.parse(responseText) as SolutionImageResponse[];
      this.logger.log(
        `Successfully parsed ${images.length} solution images from AI response`,
      );

      const config = this.validator.getConfig();
      const maxImages = config.maxQuestionsPerRequest; // Reuse same limit for now
      if (images.length > maxImages) {
        this.logger.error(`Generated images count exceeds limit`, {
          generatedCount: images.length,
          maxAllowed: maxImages,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException([
          `Generated ${images.length} images, but maximum allowed is ${maxImages}`,
        ]);
      }
      return images;
    } catch (error) {
      if (error instanceof AiValidationException) throw error;
      this.logger.error(
        'Failed to parse AI solution images response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
