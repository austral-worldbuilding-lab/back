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
  ApiCreateProjectTag,
} from './decorators/project-swagger.decorators';
import { CreateTagDto } from './dto/create-tag.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {AllowedRoles} from "@modules/mandala/guards/project-role.guard";

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

  @Post(':id/tag')
  @UseGuards(ProjectRoleGuard)
  @ApiCreateProjectTag()
  async createProjectTag(
    @Param('id') projectId: string,
    @Body() tagDto: CreateTagDto,
  ): Promise<MessageResponse<TagDto>> {
    const tag = await this.projectService.createTag(projectId, tagDto);
    return {
      message: 'Tag created successfully',
      data: tag,
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

  @Delete(':projectId/tags/:tagId')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  @ApiOperation({ summary: 'Eliminar un tag de un proyecto' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: String })
  @ApiParam({ name: 'tagId', description: 'ID del tag', type: String })
  @ApiResponse({
    status: 200,
    description: 'El tag ha sido eliminado exitosamente',
    type: TagDto,
  })
  @ApiResponse({ status: 404, description: 'Proyecto o tag no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - El usuario no tiene permiso para eliminar tags',
  })
  async deleteTag(
    @Param('projectId') projectId: string,
    @Param('tagId') tagId: string,
  ): Promise<MessageResponse<TagDto>> {
    const tag = await this.projectService.removeProjectTag(projectId, tagId);

    return {
      message: 'Tag deleted successfully',
      data: tag,
    };
  }
}
