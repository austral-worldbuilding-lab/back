import { AppLogger } from '@common/services/logger.service';
import { ConsumptionModule } from '@modules/consumption/consumption.module';
import { FileModule } from '@modules/files/file.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import {
  aiProviderFactory,
  AI_PROVIDER,
} from './factories/ai-provider.factory';
import { AiAdapterUtilsService } from './services/ai-adapter-utils.service';
import { AiPromptBuilderService } from './services/ai-prompt-builder.service';
import { AiRequestValidationService } from './services/ai-request-validation.service';
import { AiStrategyRegistryService } from './services/ai-strategy-registry.service';
import { FileLoaderService } from './services/file-loader.service';
import { FileValidationService } from './services/file-validation.service';
import { GeminiFileCacheService } from './services/gemini-file-cache.service';
import { GeminiGenerationEngineService } from './services/gemini-generation-engine.service';
import { ContextPostitsStrategy } from './strategies/context-postits.strategy';
import { EncyclopediaStrategy } from './strategies/encyclopedia.strategy';
import { MandalaSummaryStrategy } from './strategies/mandala-summary.strategy';
import { PostitsSummaryStrategy } from './strategies/postits-summary.strategy';
import { PostitsStrategy } from './strategies/postits.strategy';
import { ProvocationsStrategy } from './strategies/provocations.strategy';
import { QuestionsStrategy } from './strategies/questions.strategy';

@Module({
  providers: [
    AiService,
    AiAdapterUtilsService,
    AiPromptBuilderService,
    FileLoaderService,
    FileValidationService,
    AiRequestValidationService,
    GeminiFileCacheService,
    // Strategies
    PostitsStrategy,
    ContextPostitsStrategy,
    QuestionsStrategy,
    PostitsSummaryStrategy,
    ProvocationsStrategy,
    EncyclopediaStrategy,
    MandalaSummaryStrategy,
    // Registry and Engine
    AiStrategyRegistryService,
    GeminiGenerationEngineService,
    {
      provide: AI_PROVIDER,
      useFactory: aiProviderFactory,
      inject: [
        ConfigService,
        GeminiGenerationEngineService,
        AiStrategyRegistryService,
        AppLogger,
      ],
    },
  ],
  controllers: [AiController],
  imports: [ConfigModule, FileModule, PrismaModule, ConsumptionModule],
  exports: [AiService],
})
export class AiModule {}
