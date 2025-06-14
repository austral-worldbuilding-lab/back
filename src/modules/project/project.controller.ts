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
import { ProjectParticipantGuard } from '@modules/mandala/guards/project-participant.guard';
import { ProjectDto } from './dto/project.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { TagDto } from './dto/tag.dto';
import {
  ProjectRoleGuard,
  AllowedRoles,
} from '@modules/mandala/guards/project-role.guard';

@ApiTags('Projects')
@Controller('project')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proyecto' })
  @ApiResponse({
    status: 201,
    description: 'El proyecto ha sido creado exitosamente',
    type: ProjectDto,
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta' })
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
  @ApiOperation({ summary: 'Obtener todos los proyectos con paginación' })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Elementos por página',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna una lista paginada de proyectos',
    type: [ProjectDto],
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
  ): Promise<PaginatedResponse<ProjectDto>> {
    return await this.projectService.findAllPaginated(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  @ApiParam({ name: 'id', description: 'ID del proyecto', type: String })
  @ApiResponse({
    status: 200,
    description: 'Retorna el proyecto con el ID especificado',
    type: ProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  async findOne(@Param('id') id: string): Promise<DataResponse<ProjectDto>> {
    const project = await this.projectService.findOne(id);
    return {
      data: project,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un proyecto' })
  @ApiParam({ name: 'id', description: 'ID del proyecto', type: String })
  @ApiResponse({
    status: 200,
    description: 'El proyecto ha sido actualizado exitosamente',
    type: ProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - Solo el propietario puede actualizar proyectos',
  })
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
  @ApiOperation({ summary: 'Eliminar un proyecto' })
  @ApiParam({ name: 'id', description: 'ID del proyecto', type: String })
  @ApiResponse({
    status: 200,
    description: 'El proyecto ha sido eliminado exitosamente',
    type: ProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  async remove(@Param('id') id: string): Promise<MessageResponse<ProjectDto>> {
    const project = await this.projectService.remove(id);
    return {
      message: 'Project deleted successfully',
      data: project,
    };
  }

  @Get(':id/tags')
  @UseGuards(ProjectParticipantGuard)
  @ApiOperation({ summary: 'Obtener tags de un proyecto específico' })
  @ApiParam({ name: 'id', description: 'ID del proyecto', type: String })
  @ApiResponse({
    status: 200,
    description: 'Retorna la lista de tags del proyecto',
    type: [TagDto],
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No pertenece al proyecto',
  })
  async getProjectTags(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<DataResponse<TagDto[]>> {
    const tags = await this.projectService.getProjectTags(id, req.user.id);
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
