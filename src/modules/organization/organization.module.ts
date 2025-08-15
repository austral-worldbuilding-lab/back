import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectRepository } from '@modules/project/project.repository';
import { RoleModule } from '@modules/role/role.module';
import { Module } from '@nestjs/common';

import { OrganizationRoleGuard } from './guards/organization-role.guard';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    OrganizationRepository,
    OrganizationRoleGuard,
    ProjectRepository,
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
