import { CommonModule } from '@common/common.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import queueConfig from './queue.config';
import { EncyclopediaQueueService } from './services/encyclopedia-queue.service';

@Module({
  imports: [ConfigModule.forFeature(queueConfig), CommonModule],
  providers: [EncyclopediaQueueService],
  exports: [EncyclopediaQueueService],
})
export class QueueModule {}
