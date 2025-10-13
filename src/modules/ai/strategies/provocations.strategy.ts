import { AppLogger } from '@common/services/logger.service';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';
import { Injectable } from '@nestjs/common';

import { createProvocationsResponseSchema } from '../resources/dto/generate-postits.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface ProvocationsInput {
  projectName: string;
  projectDescription: string;
  mandalasAiSummary: string;
  mandalasSummariesWithAi: string;
}

@Injectable()
export class ProvocationsStrategy
  implements AiGenerationStrategy<ProvocationsInput, AiProvocationResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: ProvocationsInput): Promise<string> {
    return this.promptBuilder.buildProvocationPrompt(
      input.projectName,
      input.projectDescription,
      input.mandalasAiSummary,
      input.mandalasSummariesWithAi,
    );
  }

  getResponseSchema(): unknown {
    return createProvocationsResponseSchema({
      minItems: this.utils.getMinProvocations(),
      maxItems: this.utils.getMaxProvocations(),
    });
  }

  parseAndValidate(responseText: string | undefined): AiProvocationResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const provocations = JSON.parse(responseText) as AiProvocationResponse[];
      this.logger.log(
        `Successfully parsed ${provocations.length} provocation responses from AI`,
      );
      return provocations;
    } catch (error) {
      this.logger.error(
        'Failed to parse AI provocation response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
