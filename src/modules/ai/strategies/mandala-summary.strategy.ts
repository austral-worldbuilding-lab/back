import { AppLogger } from '@common/services/logger.service';
import { Injectable } from '@nestjs/common';

import { createMandalaSummaryResponseSchema } from '../resources/dto/generate-summary.dto';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiMandalaSummaryResponse } from '../types/ai-mandala-summary-response.type';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface MandalaSummaryInput {
  dimensions: string[];
  scales: string[];
  centerCharacter: string;
  centerCharacterDescription: string;
  cleanMandalaDocument: string;
}

@Injectable()
export class MandalaSummaryStrategy
  implements AiGenerationStrategy<MandalaSummaryInput, AiMandalaSummaryResponse>
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: MandalaSummaryInput): Promise<string> {
    return this.promptBuilder.buildMandalaSummaryPrompt(
      input.dimensions,
      input.scales,
      input.centerCharacter,
      input.centerCharacterDescription,
      input.cleanMandalaDocument,
    );
  }

  getResponseSchema(): unknown {
    return createMandalaSummaryResponseSchema();
  }

  parseAndValidate(responseText: string | undefined): AiMandalaSummaryResponse {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    try {
      const parsed = JSON.parse(responseText) as {
        summary?: string;
        html?: string;
      };

      if (!parsed.summary || !parsed.html) {
        this.logger.warn(
          'JSON parsed but missing fields, falling back to plain text',
        );
        return {
          summary: responseText,
          html: '',
        };
      }

      this.logger.log('Successfully parsed mandala summary response as JSON');
      return {
        summary: parsed.summary,
        html: parsed.html,
      };
    } catch (parseError) {
      this.logger.warn(
        'Failed to parse as JSON, treating as plain text (legacy format)',
        { parseError },
      );
      return {
        summary: responseText,
        html: '',
      };
    }
  }
}
