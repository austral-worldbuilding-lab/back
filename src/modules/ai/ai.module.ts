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
import { FileLoaderService } from './services/file-loader.service';
import { FileValidationService } from './services/file-validation.service';

@Module({
  providers: [
    AiService,
    AiAdapterUtilsService,
    AiPromptBuilderService,
    FileLoaderService,
    FileValidationService,
    AiRequestValidationService,
    {
      provide: AI_PROVIDER,
      useFactory: aiProviderFactory,
      inject: [
        ConfigService,
        AiRequestValidationService,
        AiAdapterUtilsService,
        AiPromptBuilderService,
        AppLogger,
      ],
    },
  ],
  controllers: [AiController],
  imports: [ConfigModule, FileModule, PrismaModule, ConsumptionModule],
  exports: [AiService],
})
export class AiModule {}
