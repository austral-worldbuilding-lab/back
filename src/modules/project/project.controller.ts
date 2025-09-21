import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import {
  OrganizationRoleGuard,
  RequireOrganizationRoles,
} from '@modules/organization/guards/organization-role.guard';
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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import {
  ApiCreateProject,
  ApiGetAllProjects,
  ApiGetProject,
  ApiUpdateProject,
  ApiDeleteProject,
  ApiGetProjectTags,
  ApiCreateProjectTag,
  ApiDeleteProjectTag,
  ApiUpdateUserRole,
  ApiGetProjectUsers,
  ApiRemoveUserFromProject,
  ApiGenerateProjectProvocations,
  ApiGetCachedProvocations,
  ApiCreateProvocation,
} from './decorators/project-swagger.decorators';
import { AiProvocationResponseDto } from './dto/ai-provocation-response.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProvocationDto } from './dto/create-provocation.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { GenerateProvocationsDto } from './dto/generate-provocations.dto';
import { ProjectUserDto } from './dto/project-user.dto';
import { ProjectDto } from './dto/project.dto';
import { ProvocationDto } from './dto/provocation.dto';
import { TagDto } from './dto/tag.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRoleResponseDto } from './dto/user-role-response.dto';
import {
  ProjectRoleGuard,
  RequireProjectRoles,
} from './guards/project-role.guard';
import { ProjectService } from './project.service';
import { AiProvocationResponse } from './types/provocations.type';

@ApiTags('Projects')
@Controller('project')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
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
    @Query(
      'limit',
      new DefaultValuePipe(10),
      ParseIntPipe,
      new MinValuePipe(1),
      new MaxValuePipe(100),
    )
    limit: number,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<ProjectDto>> {
    return await this.projectService.findAllPaginated(page, limit, req.user.id);
  }

  @Get(':id')
  @UseGuards(ProjectRoleGuard)
  @ApiGetProject()
  async findOne(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<ProjectDto>> {
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
    @Param('id', new UuidValidationPipe()) id: string,
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
  async remove(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.remove(id);
    return {
      message: 'Project deleted successfully',
      data: project,
    };
  }

  @Post(':id/tag')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('owner', 'admin', 'member')
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
  @RequireProjectRoles('owner')
  @ApiDeleteProjectTag()
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

  @Put(':projectId/users/:userId/role')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('owner', 'admin')
  @ApiUpdateUserRole()
  async updateUserRole(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Param('userId') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<MessageResponse<UserRoleResponseDto>> {
    const userRole = await this.projectService.updateUserRole(
      projectId,
      userId,
      updateUserRoleDto.role,
    );
    return {
      message: 'Rol de usuario actualizado exitosamente',
      data: userRole,
    };
  }

  @Get(':projectId/users')
  @UseGuards(ProjectRoleGuard)
  @ApiGetProjectUsers()
  async getProjectUsers(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<ProjectUserDto[]>> {
    const users = await this.projectService.getProjectUsers(projectId);
    return {
      data: users,
    };
  }

  @Delete(':projectId/users/:userId')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('owner', 'admin')
  @ApiRemoveUserFromProject()
  async removeUserFromProject(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Param('userId', new UuidValidationPipe()) userId: string,
    @Req() req: RequestWithUser,
  ): Promise<MessageResponse<ProjectUserDto>> {
    const removedUser = await this.projectService.removeUserFromProject(
      projectId,
      userId,
      req.user.id,
    );
    return {
      message: 'Usuario eliminado del proyecto exitosamente',
      data: removedUser,
    };
  }

  @Post(':id/generate-provocations')
  @UseGuards(ProjectRoleGuard)
  @ApiGenerateProjectProvocations()
  async generateProvocations(
    @Param('id', new UuidValidationPipe()) projectId: string,
    @Body() generateProvocationsDto: GenerateProvocationsDto,
    @Req() request: RequestWithUser,
  ): Promise<DataResponse<AiProvocationResponse[]>> {
    const userId = request.user.id;
    const provocations = await this.projectService.generateProvocations(
      userId,
      projectId,
      generateProvocationsDto.selectedFiles,
    );
    return {
      data: provocations,
    };
  }

  @Get(':id/cached-provocations')
  @UseGuards(ProjectRoleGuard)
  @ApiGetCachedProvocations()
  async getCachedProvocations(
    @Param('id', new UuidValidationPipe()) projectId: string,
    @Req() request: RequestWithUser,
  ): Promise<DataResponse<AiProvocationResponseDto[]>> {
    const userId = request.user.id;
    const cachedProvocations = await this.projectService.getCachedProvocations(
      userId,
      projectId,
    );

    return {
      data: cachedProvocations,
    };
  }

  @Post(':projectId/provocation')
  @UseGuards(ProjectRoleGuard)
  @RequireProjectRoles('owner', 'admin')
  @ApiCreateProvocation()
  async createProvocation(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() createProvocationDto: CreateProvocationDto,
  ): Promise<MessageResponse<ProvocationDto>> {
    const createdProvocation = await this.projectService.createProvocation(
      projectId,
      createProvocationDto,
    );

    return {
      message: 'Provocation created successfully',
      data: createdProvocation,
    };
  }
}
