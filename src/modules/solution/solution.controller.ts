import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { ProjectService } from '@modules/project/project.service';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { CreateSolutionDecorator } from './decorators/create-solution.decorator';
import { DeleteSolutionDecorator } from './decorators/delete-solution.decorator';
import { GenerateSolutionsDecorator } from './decorators/generate-solutions.decorator';
import { GetCachedSolutionsDecorator } from './decorators/get-cached-solutions.decorator';
import { GetSolutionByIdDecorator } from './decorators/get-solution-by-id.decorator';
import { GetSolutionsByProjectDecorator } from './decorators/get-solutions-by-project.decorator';
import { GetSolutionsStatusDecorator } from './decorators/get-solutions-status.decorator';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { SolutionDto } from './dto/solution.dto';
import { SolutionsJobResponseDto } from './dto/solutions-job-response.dto';
import { SolutionsJobStatusDto } from './dto/solutions-job-status.dto';
import { SolutionService } from './solution.service';
import { AiSolutionResponse } from './types/solutions.type';

@ApiTags('Solution')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller()
export class SolutionController {
  constructor(
    private readonly solutionService: SolutionService,
    private readonly projectService: ProjectService,
  ) {}

  @Post('project/:projectId/solution')
  @CreateSolutionDecorator()
  async create(
    @Param('projectId') projectId: string,
    @Body() createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    return this.solutionService.create(projectId, createSolutionDto);
  }

  @Get('project/:projectId/solutions')
  @GetSolutionsByProjectDecorator()
  async findAll(@Param('projectId') projectId: string): Promise<SolutionDto[]> {
    return this.solutionService.findAll(projectId);
  }

  @Get('solutions/:id')
  @GetSolutionByIdDecorator()
  async findOne(@Param('id') id: string): Promise<SolutionDto> {
    return this.solutionService.findOne(id);
  }

  @Delete('solutions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteSolutionDecorator()
  async remove(@Param('id') id: string): Promise<void> {
    await this.solutionService.remove(id);
  }

  @Post('project/:projectId/solutions/generate')
  @GenerateSolutionsDecorator()
  async generateSolutions(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Req() req: RequestWithUser,
  ): Promise<SolutionsJobResponseDto> {
    const userId = req.user.id;
    const project = await this.projectService.findOne(projectId);

    const jobId = await this.solutionService.queueSolutionsGeneration(
      projectId,
      userId,
      project.organizationId,
    );

    return {
      jobId,
      message: 'Solutions generation job has been queued',
    };
  }

  @Get('project/:projectId/solutions/generate/status')
  @GetSolutionsStatusDecorator()
  async getSolutionsGenerationStatus(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<SolutionsJobStatusDto> {
    await this.projectService.findOne(projectId);

    const status = await this.solutionService.getSolutionsJobStatus(projectId);

    return {
      jobId: status.jobId,
      status: status.status,
      progress: status.progress,
      solutions: status.result?.solutions,
      error: status.error,
      failedReason: status.failedReason,
      createdAt: status.createdAt,
      processedAt: status.processedAt,
      finishedAt: status.finishedAt,
    };
  }

  @Get('project/:projectId/solutions/cached')
  @GetCachedSolutionsDecorator()
  async getCachedSolutions(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<AiSolutionResponse[]> {
    await this.projectService.findOne(projectId);

    return this.solutionService.getCachedSolutions(projectId);
  }
}
