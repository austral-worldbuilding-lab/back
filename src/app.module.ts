import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FileModule } from '@modules/files/file.module';
import { InvitationModule } from '@modules/invitation/invitation.module';
import { MandalaModule } from '@modules/mandala/mandala.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ProjectModule } from '@modules/project/project.module';
import { RoleModule } from '@modules/role/role.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    ProjectModule,
    UserModule,
    InvitationModule,
    MandalaModule,
    AuthModule,
    FileModule,
    AiModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
