import { ConfigService } from '@nestjs/config';
import { FileService } from '@modules/files/file.service';
import { GeminiAdapter } from '../adapters/gemini-adapter';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { AiRequestValidator } from '../validators/ai-request.validator';
import { AiAdapterUtilsService } from '../services/ai-adapter-utils.service';

export const AI_PROVIDER = 'AI_PROVIDER';

export function aiProviderFactory(
  configService: ConfigService,
  fileService: FileService,
  validator: AiRequestValidator,
  utilsService: AiAdapterUtilsService,
): AiProvider {
  const aiProvider = configService.get<string>('AI_PROVIDER', 'gemini');

  switch (aiProvider.toLowerCase()) {
    case 'gemini':
      return new GeminiAdapter(configService, validator, utilsService);
    default:
      throw new Error(
        `Unknown AI provider: ${aiProvider}. Supported: gemini. Check your .env file.`,
      );
  }
}
