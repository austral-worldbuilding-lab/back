import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectModule } from '@modules/project/project.module';
import { Module } from '@nestjs/common';

import { SolutionController } from './solution.controller';
import { SolutionRepository } from './solution.repository';
import { SolutionService } from './solution.service';

@Module({
  imports: [PrismaModule, AuthModule, ProjectModule],
  controllers: [SolutionController],
  providers: [SolutionService, SolutionRepository],
  exports: [SolutionService],
})
export class SolutionModule {}
