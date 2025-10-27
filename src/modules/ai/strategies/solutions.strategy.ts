import { AppLogger } from '@common/services/logger.service';
import { AiSolutionResponse } from '@modules/solution/types/solutions.type';
import { Injectable } from '@nestjs/common';

import { createSolutionsResponseSchema } from '../resources/dto/generate-postits.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface SolutionsInput {
  projectId: string;
  projectName: string;
  projectDescription: string;
  encyclopedia: string;
}

@Injectable()
export class SolutionsStrategy
  implements AiGenerationStrategy<SolutionsInput, AiSolutionResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: SolutionsInput): Promise<string> {
    return this.promptBuilder.buildSolutionPrompt(
      input.projectId,
      input.projectName,
      input.projectDescription,
      input.encyclopedia,
    );
  }

  getResponseSchema(): unknown {
    return createSolutionsResponseSchema({
      minItems: this.utils.getMinSolutions(),
      maxItems: this.utils.getMaxSolutions(),
    });
  }

  parseAndValidate(responseText: string | undefined): AiSolutionResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const solutions = JSON.parse(responseText) as AiSolutionResponse[];
      this.logger.log(
        `Successfully parsed ${solutions.length} solution responses from AI`,
      );
      return solutions;
    } catch (error) {
      this.logger.error('Failed to parse AI solution response as JSON:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
