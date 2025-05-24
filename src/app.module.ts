import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { InvitationModule } from './invitation/invitation.module';
import { MandalaModule } from './mandala/mandala.module';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './files/file.module';
import { AiModule } from './ai/ai.module';

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
