import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectModule } from '@modules/project/project.module';
import { Module } from '@nestjs/common';

import { MandalaRoleGuard } from './guards/mandala-role.guard';
import { MandalaController } from './mandala.controller';
import { MandalaRepository } from './mandala.repository';
import { MandalaService } from './mandala.service';
import { PostitService } from './services/postit.service';

@Module({
  imports: [PrismaModule, AuthModule, FirebaseModule, AiModule, ProjectModule],
  controllers: [MandalaController],
  providers: [
    MandalaService,
    MandalaRepository,
    PostitService,
    MandalaRoleGuard,
  ],
  exports: [MandalaService],
})
export class MandalaModule {}
