import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';

@Module({
  providers: [AiService],
  controllers: [AiController],
  imports: [ConfigModule],
})
export class AiModule {} 