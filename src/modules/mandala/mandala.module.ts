import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectModule } from '@modules/project/project.module';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { forwardRef, Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { OrganizationModule } from '../organization/organization.module';

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
    NotificationModule,
    OrganizationModule,
  ],
  controllers: [MandalaController],
  providers: [
    MandalaService,
    MandalaRepository,
    PostitService,
    ImageService,
    MandalaRoleGuard,
    AzureBlobStorageService,
    TextStorageService,
  ],
  exports: [MandalaService],
})
export class MandalaModule {}
