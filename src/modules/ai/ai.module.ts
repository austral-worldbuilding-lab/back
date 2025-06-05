import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { FileModule } from '@modules/files/file.module';
import { FileService } from '@modules/files/file.service';
import {
  aiProviderFactory,
  AI_PROVIDER,
} from './factories/ai-provider.factory';

@Module({
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useFactory: aiProviderFactory,
      inject: [ConfigService, FileService],
    },
  ],
  controllers: [AiController],
  imports: [ConfigModule, FileModule],
  exports: [AiService],
})
export class AiModule {}
