import { AiGenerationEngineContext } from '../strategies/ai-generation-strategy.interface';
import { AiUsageInfo } from '../types/ai-response-with-usage.type';

export interface AiGenerationEngine {
  run(
    model: string,
    prompt: string,
    responseSchema: unknown,
    context: AiGenerationEngineContext,
  ): Promise<{ text: string | undefined; usage: AiUsageInfo }>;
}
