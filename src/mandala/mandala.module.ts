import { Module } from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { MandalaController } from './mandala.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MandalaController],
  providers: [MandalaService, PrismaService],
})
export class MandalaModule {}
