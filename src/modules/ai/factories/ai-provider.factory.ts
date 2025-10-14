import { AppLogger } from '@common/services/logger.service';
import { ConfigService } from '@nestjs/config';

import { GeminiAdapter } from '../adapters/gemini-adapter';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiGenerationEngine } from '../services/ai-generation-engine.interface';
import { AiStrategyRegistryService } from '../services/ai-strategy-registry.service';

export const AI_PROVIDER = 'AI_PROVIDER';

export function aiProviderFactory(
  configService: ConfigService,
  engine: AiGenerationEngine,
  strategies: AiStrategyRegistryService,
  logger: AppLogger,
): AiProvider {
  const aiProvider = configService.get<string>('AI_PROVIDER', 'gemini');

  switch (aiProvider.toLowerCase()) {
    case 'gemini':
      return new GeminiAdapter(configService, engine, strategies, logger);
    default:
      throw new Error(
        `Unknown AI provider: ${aiProvider}. Supported: gemini. Check your .env file.`,
      );
  }
}
