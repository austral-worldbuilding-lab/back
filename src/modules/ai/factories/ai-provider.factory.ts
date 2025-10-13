import { AppLogger } from '@common/services/logger.service';
import { ConfigService } from '@nestjs/config';

import { GeminiAdapter } from '../adapters/gemini-adapter';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '../services/ai-prompt-builder.service';
import { AiRequestValidationService } from '../services/ai-request-validation.service';
import { GeminiFileCacheService } from '../services/gemini-file-cache.service';

export const AI_PROVIDER = 'AI_PROVIDER';

export function aiProviderFactory(
  configService: ConfigService,
  validator: AiRequestValidationService,
  utilsService: AiAdapterUtilsService,
  promptBuilderService: AiPromptBuilderService,
  geminiCacheService: GeminiFileCacheService,
  logger: AppLogger,
): AiProvider {
  const aiProvider = configService.get<string>('AI_PROVIDER', 'gemini');

  switch (aiProvider.toLowerCase()) {
    case 'gemini':
      return new GeminiAdapter(
        configService,
        validator,
        utilsService,
        promptBuilderService,
        geminiCacheService,
        logger,
      );
    default:
      throw new Error(
        `Unknown AI provider: ${aiProvider}. Supported: gemini. Check your .env file.`,
      );
  }
}
