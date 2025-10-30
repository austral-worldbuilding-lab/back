import { AppLogger } from '@common/services/logger.service';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { Injectable } from '@nestjs/common';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { createPostitsResponseSchema } from '../resources/dto/generate-postits.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiRequestValidationService } from '../services/ai-request-validation.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface ContextPostitsInput {
  projectId: string;
  projectName: string;
  projectDescription: string;
  dimensions: string[];
  scales: string[];
  centerContext: string;
  centerContextDescription: string;
  tags: string[];
  isFutureProject: boolean;
}

@Injectable()
export class ContextPostitsStrategy
  implements AiGenerationStrategy<ContextPostitsInput, AiPostitResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly validator: AiRequestValidationService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: ContextPostitsInput): Promise<string> {
    return this.promptBuilder.buildContextPostitPrompt(
      input.projectId,
      input.projectName,
      input.projectDescription,
      input.dimensions,
      input.scales,
      input.centerContext,
      input.centerContextDescription,
      input.tags,
      input.isFutureProject,
    );
  }

  getResponseSchema(): unknown {
    return createPostitsResponseSchema({
      minItems: this.utils.getMinPostits(),
      maxItems: this.utils.getMaxPostits(),
    });
  }

  parseAndValidate(responseText: string | undefined): AiPostitResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const normalizedResponseText = responseText.replace(
        /"scale"\s*:/g,
        '"section":',
      );
      const postits = JSON.parse(normalizedResponseText) as AiPostitResponse[];
      this.logger.log(
        `Successfully parsed ${postits.length} context postits from AI response`,
      );

      const config = this.validator.getConfig();
      if (postits.length > config.maxPostitsPerRequest) {
        this.logger.error(`Generated postits count exceeds limit`, {
          generatedCount: postits.length,
          maxAllowed: config.maxPostitsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException([
          `Generated ${postits.length} postits, but maximum allowed is ${config.maxPostitsPerRequest}`,
        ]);
      }

      return postits;
    } catch (error) {
      if (error instanceof AiValidationException) throw error;
      this.logger.error('Failed to parse AI response as JSON:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
