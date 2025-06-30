import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { RoleService } from './role.service';

@Module({
  imports: [PrismaModule],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
