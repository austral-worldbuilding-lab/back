import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileRoleGuard } from './guards/file-role.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FileController],
  providers: [FileService, FileRoleGuard],
  exports: [FileService],
})
export class FileModule {}
