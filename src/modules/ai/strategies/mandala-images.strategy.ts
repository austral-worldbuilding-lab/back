import { AppLogger } from '@common/services/logger.service';
import { AiMandalaImageResponse } from '@modules/mandala/types/mandala-images.type';
import { Injectable } from '@nestjs/common';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiRequestValidationService } from '../services/ai-request-validation.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface MandalaImagesInput {
  projectName: string;
  projectDescription: string;
  dimensions: string[];
  scales: string[];
  centerCharacter: string;
  centerCharacterDescription: string;
  mandalaDocument: string;
}

@Injectable()
export class MandalaImagesStrategy
  implements AiGenerationStrategy<MandalaImagesInput, AiMandalaImageResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly validator: AiRequestValidationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MandalaImagesStrategy.name);
  }

  async buildPrompt(input: MandalaImagesInput): Promise<string> {
    return this.promptBuilder.buildMandalaImagesPrompt(
      input.projectName,
      input.projectDescription,
      input.dimensions,
      input.scales,
      input.centerCharacter,
      input.centerCharacterDescription,
      input.mandalaDocument,
    );
  }

  getResponseSchema(): unknown {
    return null;
  }

  parseAndValidate(
    responseText: string | undefined,
    input?: MandalaImagesInput,
  ): AiMandalaImageResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const images = JSON.parse(responseText) as AiMandalaImageResponse[];
      this.logger.log(
        `Successfully parsed ${images.length} images from AI response`,
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
        'Failed to parse AI mandala images response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
