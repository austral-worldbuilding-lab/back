import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { ConsumptionRepository } from './consumption.repository';
import { ConsumptionService } from './consumption.service';

@Module({
  imports: [PrismaModule],
  providers: [ConsumptionService, ConsumptionRepository],
  exports: [ConsumptionService],
})
export class ConsumptionModule {}
