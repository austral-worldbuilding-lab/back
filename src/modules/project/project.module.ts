import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FileModule } from '@modules/files/file.module';
import { MandalaModule } from '@modules/mandala/mandala.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RoleModule } from '@modules/role/role.module';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { forwardRef, Module } from '@nestjs/common';

import { ProjectRoleGuard } from './guards/project-role.guard';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RoleModule,
    forwardRef(() => MandalaModule),
    AiModule,
    FileModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, ProjectRoleGuard, AzureBlobStorageService],
  exports: [ProjectService],
})
export class ProjectModule {}
