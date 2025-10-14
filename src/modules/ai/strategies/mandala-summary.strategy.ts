import { Injectable } from '@nestjs/common';

import { createMandalaSummaryResponseSchema } from '../resources/dto/generate-summary.dto';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';

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
  implements AiGenerationStrategy<MandalaSummaryInput, string>
{
  constructor(private readonly promptBuilder: AiPromptBuilderService) {}

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

  parseAndValidate(responseText: string | undefined): string {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }
    return responseText;
  }
}
