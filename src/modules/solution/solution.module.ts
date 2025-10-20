import { CommonModule } from '@common/common.module';
import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectModule } from '@modules/project/project.module';
import { SolutionsProcessor } from '@modules/queue/processors/solutions.processor';
import { QueueModule } from '@modules/queue/queue.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SolutionController } from './solution.controller';
import { SolutionRepository } from './solution.repository';
import { SolutionService } from './solution.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProjectModule,
    QueueModule,
    CommonModule,
    ConfigModule,
    AiModule,
  ],
  controllers: [SolutionController],
  providers: [SolutionService, SolutionRepository, SolutionsProcessor],
  exports: [SolutionService],
})
export class SolutionModule {}
