import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { GenerateEncyclopediaDto } from '@modules/ai/dto/generate-encyclopedia.dto';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  ApiGenerateProjectEncyclopedia,
  ApiGetEncyclopediaJobStatus,
} from './decorators/project-swagger.decorators';
import { EncyclopediaJobResponseDto } from './dto/encyclopedia-job-response.dto';
import { EncyclopediaJobStatusDto } from './dto/encyclopedia-job-status.dto';
import {
  ProjectRoleGuard,
  RequireProjectRoles,
} from './guards/project-role.guard';
import { ProjectService } from './project.service';

@ApiTags('Encyclopedia')
@Controller('project/:projectId/encyclopedia')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class EncyclopediaController {
  constructor(private readonly projectService: ProjectService) {}

  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post()
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('worldbuilder', 'dueño', 'facilitador')
  @ApiGenerateProjectEncyclopedia()
  async generateEncyclopedia(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() generateEncyclopediaDto: GenerateEncyclopediaDto,
  ): Promise<EncyclopediaJobResponseDto> {
    await this.projectService.findOne(projectId);

    const jobId = await this.projectService.queueEncyclopediaGeneration(
      projectId,
      generateEncyclopediaDto.selectedFiles,
    );

    return {
      jobId,
      message: 'Encyclopedia generation job has been queued',
    };
  }

  @Get('status')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('worldbuilder', 'dueño', 'facilitador')
  @ApiGetEncyclopediaJobStatus()
  async getEncyclopediaStatus(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<EncyclopediaJobStatusDto> {
    await this.projectService.findOne(projectId);

    const status =
      await this.projectService.getEncyclopediaJobStatus(projectId);

    return {
      jobId: status.jobId,
      status: status.status,
      progress: status.progress,
      encyclopedia: status.result?.encyclopedia,
      storageUrl: status.result?.storageUrl,
      error: status.error,
      failedReason: status.failedReason,
      createdAt: status.createdAt,
      processedAt: status.processedAt,
      finishedAt: status.finishedAt,
    };
  }
}
