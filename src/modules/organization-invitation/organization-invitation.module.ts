import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RoleModule } from '@modules/role/role.module';
import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';

import { OrganizationInvitationAccessGuard } from './guards/organization-invitation-access.guard';
import { OrganizationInvitationRoleGuard } from './guards/organization-invitation-role.guard';
import { OrganizationInvitationController } from './organization-invitation.controller';
import { OrganizationInvitationRepository } from './organization-invitation.repository';
import { OrganizationInvitationService } from './organization-invitation.service';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule, MailModule],
  controllers: [OrganizationInvitationController],
  providers: [
    OrganizationInvitationService,
    OrganizationInvitationRepository,
    OrganizationInvitationRoleGuard,
    OrganizationInvitationAccessGuard,
  ],
})
export class OrganizationInvitationModule {}
