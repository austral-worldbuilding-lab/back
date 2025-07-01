import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RoleModule } from '@modules/role/role.module';
import { Module } from '@nestjs/common';

import { InvitationAccessGuard } from './guards/invitation-access.guard';
import { InvitationRoleGuard } from './guards/invitation-role.guard';
import { InvitationController } from './invitation.controller';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [InvitationController],
  providers: [
    InvitationService,
    InvitationRepository,
    InvitationRoleGuard,
    InvitationAccessGuard,
  ],
})
export class InvitationModule {}
