import { AiModule } from '@modules/ai/ai.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [PrismaModule, FirebaseModule, AiModule],
  controllers: [HealthController],
  providers: [HealthService, AzureBlobStorageService],
  exports: [HealthService],
})
export class HealthModule {}
