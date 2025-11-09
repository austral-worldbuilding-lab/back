import { AppLogger } from '@common/services/logger.service';
import { AiActionItemResponse } from '@modules/solution/types/action-items.type';
import { Injectable } from '@nestjs/common';

import { createActionItemsResponseSchema } from '../resources/dto/generate-action-items.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface ActionItemsInput {
  projectId: string;
  projectName: string;
  projectDescription: string;
  solutionTitle: string;
  solutionDescription: string;
  solutionProblem: string;
}

@Injectable()
export class ActionItemsStrategy
  implements AiGenerationStrategy<ActionItemsInput, AiActionItemResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: ActionItemsInput): Promise<string> {
    const solution = `Title: ${input.solutionTitle}\nDescription: ${input.solutionDescription}\nProblem: ${input.solutionProblem}`;

    return this.promptBuilder.buildActionItemsPrompt(
      input.projectId,
      input.projectName,
      input.projectDescription,
      solution,
    );
  }

  getResponseSchema(): unknown {
    return createActionItemsResponseSchema({
      minItems: this.utils.getMinActionItems(),
      maxItems: this.utils.getMaxActionItems(),
    });
  }

  parseAndValidate(responseText: string | undefined): AiActionItemResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const actionItems = JSON.parse(responseText) as AiActionItemResponse[];
      this.logger.log(
        `Successfully parsed ${actionItems.length} action item responses from AI`,
      );
      return actionItems;
    } catch (error) {
      this.logger.error(
        'Failed to parse AI action items response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
