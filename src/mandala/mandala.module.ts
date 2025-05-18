import { Module } from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { MandalaController } from './mandala.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MandalaRepository } from './mandala.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MandalaController],
  providers: [MandalaService, MandalaRepository],
  exports: [MandalaService],
})
export class MandalaModule {}
