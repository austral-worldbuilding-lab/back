import { FileController } from './file.controller';
import { FileService } from './file.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { ProjectParticipantGuard } from '@modules/mandala/guards/project-participant.guard';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [FileController],
  providers: [FileService, ProjectParticipantGuard],
  exports: [FileService],
})
export class FileModule {}
