import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { MandalaModule } from './mandala/mandala.module';

@Module({
  imports: [PrismaModule, ProjectModule, UserModule, MandalaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
