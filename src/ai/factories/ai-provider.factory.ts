import { ConfigService } from '@nestjs/config';
import { FileService } from '../../files/file.service';
import { GeminiAdapter } from '../adapters/gemini-adapter';
import { AiProvider } from '../interfaces/ai-provider.interface';

export const AI_PROVIDER = 'AI_PROVIDER';

export function aiProviderFactory(
  configService: ConfigService,
  fileService: FileService,
): AiProvider {
  const aiProvider = configService.get<string>('AI_PROVIDER', 'gemini');

  switch (aiProvider.toLowerCase()) {
    case 'gemini':
      return new GeminiAdapter(configService, fileService);
    default:
      throw new Error(
        `Unknown AI provider: ${aiProvider}. Supported: gemini. Check your .env file.`,
      );
  }
}
