import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';
import { FileModule } from '../files/file.module';

@Module({
  providers: [AiService],
  controllers: [AiController],
  imports: [ConfigModule, FileModule],
  exports: [AiService],
})
export class AiModule {}
