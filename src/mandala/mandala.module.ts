import { Module } from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { MandalaController } from './mandala.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MandalaRepository } from './mandala.repository';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [PrismaModule, AuthModule, FirebaseModule],
  controllers: [MandalaController],
  providers: [MandalaService, MandalaRepository],
  exports: [MandalaService],
})
export class MandalaModule {}
