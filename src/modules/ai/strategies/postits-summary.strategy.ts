import { AppLogger } from '@common/services/logger.service';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import { AiPostitComparisonResponse } from '@modules/mandala/types/postits';
import { Injectable } from '@nestjs/common';

import { createPostitsSummaryResponseSchema } from '../resources/dto/generate-postits.dto';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';

import { AiGenerationStrategy } from './ai-generation-strategy.interface';

export interface PostitsSummaryInput {
  projectName: string;
  projectDescription: string;
  mandalasAiSummary: string;
}

@Injectable()
export class PostitsSummaryStrategy
  implements
    AiGenerationStrategy<
      PostitsSummaryInput,
      { comparisons: AiPostitComparisonResponse[]; report: AiMandalaReport }
    >
{
  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly utils: AiAdapterUtilsService,
    private readonly logger: AppLogger,
  ) {}

  async buildPrompt(input: PostitsSummaryInput): Promise<string> {
    return this.promptBuilder.buildPostitSummaryPrompt(
      input.projectName,
      input.projectDescription,
      input.mandalasAiSummary,
    );
  }

  getResponseSchema(): unknown {
    return createPostitsSummaryResponseSchema({
      minItems: this.utils.getMinResults(),
      maxItems: this.utils.getMaxResults(),
    });
  }

  parseAndValidate(responseText: string | undefined): {
    comparisons: AiPostitComparisonResponse[];
    report: AiMandalaReport;
  } {
    if (!responseText) {
      throw new Error('No response text received from Gemini API');
    }

    interface GeminiComparisonWithReport {
      comparisons?: AiPostitComparisonResponse[];
      report?: Partial<AiMandalaReport>;
    }

    let parsed: GeminiComparisonWithReport;
    try {
      parsed = JSON.parse(responseText) as GeminiComparisonWithReport;
    } catch {
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start < 0 || end < 0) {
        this.logger.error('Invalid JSON response from Gemini API');
        throw new Error('Invalid JSON response from Gemini API');
      }
      parsed = JSON.parse(
        responseText.slice(start, end + 1),
      ) as GeminiComparisonWithReport;
    }

    const normalizedComparisonsText = Array.isArray(parsed.comparisons)
      ? JSON.stringify(parsed.comparisons).replace(/"scale"\s*:/g, '"section":')
      : JSON.stringify([]);

    const comparisons = JSON.parse(
      normalizedComparisonsText,
    ) as AiPostitComparisonResponse[];

    const report: AiMandalaReport = {
      summary:
        parsed.report && typeof parsed.report.summary === 'string'
          ? parsed.report.summary
          : '',
      coincidences: parsed?.report?.coincidences ?? [],
      tensions: parsed?.report?.tensions ?? [],
      insights: parsed?.report?.insights ?? [],
    };

    this.logger.log(`Parsed ${comparisons.length} comparisons with report`);
    return { comparisons, report };
  }
}
