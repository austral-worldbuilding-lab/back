import { AppLogger } from '@common/services/logger.service';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { Injectable } from '@nestjs/common';

import { AiValidationException } from '../exceptions/ai-validation.exception';
import { createQuestionsResponseSchema } from '../resources/dto/generate-questions.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiRequestValidationService } from '../services/ai-request-validation.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface QuestionsInput {
  projectName: string;
  projectDescription: string;
  dimensions: string[];
  scales: string[];
  tags: string[];
  centerCharacter: string;
  centerCharacterDescription: string;
  mandalaAiSummary: string;
}

@Injectable()
export class QuestionsStrategy
  implements AiGenerationStrategy<QuestionsInput, AiQuestionResponse[]>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly validator: AiRequestValidationService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: QuestionsInput): Promise<string> {
    return this.promptBuilder.buildQuestionPrompt(
      input.projectName,
      input.projectDescription,
      input.dimensions,
      input.scales,
      input.tags,
      input.centerCharacter,
      input.centerCharacterDescription,
      input.mandalaAiSummary,
    );
  }

  getResponseSchema(): unknown {
    return createQuestionsResponseSchema({
      minItems: this.utils.getMinQuestions(),
      maxItems: this.utils.getMaxQuestions(),
    });
  }

  parseAndValidate(responseText: string | undefined): AiQuestionResponse[] {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    try {
      const questions = JSON.parse(responseText) as AiQuestionResponse[];
      this.logger.log(
        `Successfully parsed ${questions.length} questions from AI response`,
      );

      const config = this.validator.getConfig();
      if (questions.length > config.maxQuestionsPerRequest) {
        this.logger.error(`Generated questions count exceeds limit`, {
          generatedCount: questions.length,
          maxAllowed: config.maxQuestionsPerRequest,
          timestamp: new Date().toISOString(),
        });
        throw new AiValidationException([
          `Generated ${questions.length} questions, but maximum allowed is ${config.maxQuestionsPerRequest}`,
        ]);
      }
      return questions;
    } catch (error) {
      if (error instanceof AiValidationException) throw error;
      this.logger.error(
        'Failed to parse AI questions response as JSON:',
        error,
      );
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}
