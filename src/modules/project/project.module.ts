import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ProjectRepository } from './project.repository';
import { ProjectParticipantGuard } from '@modules/mandala/guards/project-participant.guard';
import { RoleModule } from '@modules/role/role.module';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, ProjectParticipantGuard],
  exports: [ProjectService],
})
export class ProjectModule {}
