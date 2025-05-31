import { Module } from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { MandalaController } from './mandala.controller';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { MandalaRepository } from './mandala.repository';
import { AuthModule } from '@modules/auth/auth.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { AiModule } from '@modules/ai/ai.module';
import { PostitService } from './services/postit.service';

@Module({
  imports: [PrismaModule, AuthModule, FirebaseModule, AiModule],
  controllers: [MandalaController],
  providers: [MandalaService, MandalaRepository, PostitService],
  exports: [MandalaService],
})
export class MandalaModule {}
