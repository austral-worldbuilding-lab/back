import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { InvitationRepository } from './invitation.repository';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { RoleModule } from '@modules/role/role.module';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository],
})
export class InvitationModule {}
