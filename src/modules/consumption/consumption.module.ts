import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { ConsumptionController } from './consumption.controller';
import { ConsumptionRepository } from './consumption.repository';
import { ConsumptionService } from './consumption.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConsumptionController],
  providers: [ConsumptionService, ConsumptionRepository],
  exports: [ConsumptionService],
})
export class ConsumptionModule {}
