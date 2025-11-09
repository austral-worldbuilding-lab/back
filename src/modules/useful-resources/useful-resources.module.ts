import { CommonModule } from '@common/common.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FileModule } from '@modules/files/file.module';
import { Module } from '@nestjs/common';

import { UsefulResourcesController } from './useful-resources.controller';
import { UsefulResourcesService } from './useful-resources.service';

@Module({
  imports: [CommonModule, FileModule, AuthModule],
  controllers: [UsefulResourcesController],
  providers: [UsefulResourcesService],
})
export class UsefulResourcesModule {}
