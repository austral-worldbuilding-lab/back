import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RoleModule } from '@modules/role/role.module';
import { Module } from '@nestjs/common';

import { ProjectRoleGuard } from './guards/project-role.guard';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, ProjectRoleGuard],
  exports: [ProjectService],
})
export class ProjectModule {}
