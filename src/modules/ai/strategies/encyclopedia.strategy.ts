import { AppLogger } from '@common/services/logger.service';
import { Injectable } from '@nestjs/common';

import { createEncyclopediaResponseSchema } from '../resources/dto/generate-encyclopedia.dto';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiEncyclopediaResponse } from '../types/ai-encyclopedia-response.type';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface EncyclopediaInput {
  projectId: string;
  projectName: string;
  projectDescription: string;
  dimensions: string[];
  scales: string[];
  mandalasSummariesWithAi: string;
}

@Injectable()
export class EncyclopediaStrategy
  implements AiGenerationStrategy<EncyclopediaInput, AiEncyclopediaResponse>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: EncyclopediaInput): Promise<string> {
    return this.promptBuilder.buildEncyclopediaPrompt(
      input.projectId,
      input.projectName,
      input.projectDescription,
      input.dimensions,
      input.scales,
      input.mandalasSummariesWithAi,
    );
  }

  getResponseSchema(): unknown {
    return createEncyclopediaResponseSchema();
  }

  parseAndValidate(responseText: string | undefined): AiEncyclopediaResponse {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const parsed = JSON.parse(responseText) as {
        encyclopedia?: string;
        html?: string;
      };

      if (!parsed.encyclopedia || !parsed.html) {
        throw new Error(
          'Response missing required fields: encyclopedia or html',
        );
      }

      this.logger.log('Successfully parsed encyclopedia response from AI');
      return {
        encyclopedia: parsed.encyclopedia,
        html: parsed.html,
      };
    } catch (error) {
      this.logger.error('Failed to parse encyclopedia response', { error });
      throw new Error(
        `Invalid encyclopedia response format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
