import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectModule } from '@modules/project/project.module';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { forwardRef, Module } from '@nestjs/common';

import { MandalaRoleGuard } from './guards/mandala-role.guard';
import { MandalaController } from './mandala.controller';
import { MandalaRepository } from './mandala.repository';
import { MandalaService } from './mandala.service';
import { ImageService } from './services/image.service';
import { PostitService } from './services/postit.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FirebaseModule,
    AiModule,
    forwardRef(() => ProjectModule),
  ],
  controllers: [MandalaController],
  providers: [
    MandalaService,
    MandalaRepository,
    PostitService,
    ImageService,
    MandalaRoleGuard,
    AzureBlobStorageService,
  ],
  exports: [MandalaService],
})
export class MandalaModule {}
