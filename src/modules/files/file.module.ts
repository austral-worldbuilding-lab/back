import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MandalaFileRoleGuard } from './guards/mandala-file-role.guard';
import { OrganizationFileRoleGuard } from './guards/organization-file-role.guard';
import { ProjectFileRoleGuard } from './guards/project-file-role.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FileController],
  providers: [
    FileService,
    OrganizationFileRoleGuard,
    ProjectFileRoleGuard,
    MandalaFileRoleGuard,
  ],
  exports: [FileService],
})
export class FileModule {}
