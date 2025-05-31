import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectModule } from '@modules/project/project.module';
import { UserModule } from '@modules/user/user.module';
import { InvitationModule } from '@modules/invitation/invitation.module';
import { MandalaModule } from '@modules/mandala/mandala.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FileModule } from '@modules/files/file.module';
import { AiModule } from '@modules/ai/ai.module';

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
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
