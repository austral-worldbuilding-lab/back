import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { MinValuePipe } from '../pipes/min-value.pipe';
import { FirebaseAuthGuard } from '../auth/firebase/firebase.guard';
import { ProjectDto } from './dto/project.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '../common/types/responses';

@Controller('project')
@UseGuards(FirebaseAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.create(
      createProjectDto,
      createProjectDto.userId,
    );
    return {
      message: 'Project created successfully',
      data: project,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
  ): Promise<PaginatedResponse<ProjectDto>> {
    return await this.projectService.findAllPaginated(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DataResponse<ProjectDto>> {
    const project = await this.projectService.findOne(id);
    return {
      data: project,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.remove(id);
    return {
      message: 'Project deleted successfully',
      data: project,
    };
  }
}
