import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ProjectRepository } from './project.repository';
import { ProjectRoleGuard } from './guards/project-role.guard';
import { RoleModule } from '@modules/role/role.module';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectRepository,
    ProjectRoleGuard,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
