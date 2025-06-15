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
  Patch,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import {
  ProjectRoleGuard,
  RequireProjectRoles,
} from './guards/project-role.guard';
import { ProjectDto } from './dto/project.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { TagDto } from './dto/tag.dto';
import {
  ApiCreateProject,
  ApiGetAllProjects,
  ApiGetProject,
  ApiUpdateProject,
  ApiDeleteProject,
  ApiGetProjectTags,
} from './decorators/project-swagger.decorators';

@ApiTags('Projects')
@Controller('project')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiCreateProject()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: RequestWithUser,
  ): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.create(
      createProjectDto,
      req.user.id,
    );
    return {
      message: 'Project created successfully',
      data: project,
    };
  }

  @Get()
  @ApiGetAllProjects()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
  ): Promise<PaginatedResponse<ProjectDto>> {
    return await this.projectService.findAllPaginated(page, limit);
  }

  @Get(':id')
  @UseGuards(ProjectRoleGuard)
  @ApiGetProject()
  async findOne(@Param('id') id: string): Promise<DataResponse<ProjectDto>> {
    const project = await this.projectService.findOne(id);
    return {
      data: project,
    };
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('owner')
  @ApiUpdateProject()
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.update(id, updateProjectDto);
    return {
      message: 'Project updated successfully',
      data: project,
    };
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('owner')
  @ApiDeleteProject()
  async remove(@Param('id') id: string): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.remove(id);
    return {
      message: 'Project deleted successfully',
      data: project,
    };
  }

  @Get(':id/tags')
  @UseGuards(ProjectRoleGuard)
  @ApiGetProjectTags()
  async getProjectTags(
    @Param('id') id: string,
  ): Promise<DataResponse<TagDto[]>> {
    const tags = await this.projectService.getProjectTags(id);
    return {
      data: tags,
    };
  }
}
