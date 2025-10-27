import { AiGenerationEngineContext } from '../strategies/ai-generation-strategy.interface';
import { AiUsageInfo } from '../types/ai-response-with-usage.type';

import { AiMandalaImageResponse } from '@/modules/mandala/types/mandala-images.type';

export interface AiGenerationEngine {
  runTextGeneration(
    model: string,
    prompt: string,
    responseSchema: unknown,
    context: AiGenerationEngineContext,
    temperature?: number,
  ): Promise<{ text: string | undefined; usage: AiUsageInfo }>;

  runImageGeneration(
    model: string,
    prompt: string,
    context: AiGenerationEngineContext,
  ): Promise<{ data: AiMandalaImageResponse[]; usage: AiUsageInfo }>;
}
