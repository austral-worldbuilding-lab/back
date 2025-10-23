import { AuthModule } from '@modules/auth/auth.module';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectRepository } from '@modules/project/project.repository';
import { RoleModule } from '@modules/role/role.module';
import { Module } from '@nestjs/common';

import { OrganizationRoleGuard } from './guards/organization-role.guard';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    OrganizationRepository,
    OrganizationRoleGuard,
    ProjectRepository,
    AzureBlobStorageService,
    TextStorageService,
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
