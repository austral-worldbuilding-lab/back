import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FileModule } from '@modules/files/file.module';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { MandalaModule } from '@modules/mandala/mandala.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { EncyclopediaProcessor } from '@modules/queue/processors/encyclopedia.processor';
import { QueueModule } from '@modules/queue/queue.module';
import { RoleModule } from '@modules/role/role.module';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EncyclopediaController } from './encyclopedia.controller';
import { ProjectRoleGuard } from './guards/project-role.guard';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    RoleModule,
    forwardRef(() => MandalaModule),
    QueueModule,
    AiModule,
    FileModule,
  ],
  controllers: [ProjectController, EncyclopediaController],
  providers: [
    ProjectService,
    ProjectRepository,
    ProjectRoleGuard,
    AzureBlobStorageService,
    TextStorageService,
    EncyclopediaProcessor,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
