import { FileModule } from '@modules/files/file.module';
import { FileService } from '@modules/files/file.service';
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
import { AiRequestValidator } from './validators/ai-request.validator';

@Module({
  providers: [
    AiService,
    AiRequestValidator,
    AiAdapterUtilsService,
    AiPromptBuilderService,
    {
      provide: AI_PROVIDER,
      useFactory: aiProviderFactory,
      inject: [
        ConfigService,
        FileService,
        AiRequestValidator,
        AiAdapterUtilsService,
        AiPromptBuilderService,
      ],
    },
  ],
  controllers: [AiController],
  imports: [ConfigModule, FileModule, PrismaModule],
  exports: [AiService],
})
export class AiModule {}
