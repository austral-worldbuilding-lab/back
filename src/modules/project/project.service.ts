import { DimensionDto } from '@common/dto/dimension.dto';
import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PaginatedResponse } from '@common/types/responses';
import { RoleService } from '@modules/role/role.service';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { ProjectUserDto } from './dto/project-user.dto';
import { ProjectDto } from './dto/project.dto';
import { TagDto } from './dto/tag.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRoleResponseDto } from './dto/user-role-response.dto';
import { ProjectRepository } from './project.repository';
import { DEFAULT_DIMENSIONS, DEFAULT_SCALES } from './resources/default-values';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private roleService: RoleService,
  ) {}

  private getDimensions(dimensions?: DimensionDto[]): DimensionDto[] {
    return !dimensions || dimensions.length === 0
      ? DEFAULT_DIMENSIONS
      : dimensions;
  }

  private getScales(scales?: string[]): string[] {
    return !scales || scales.length === 0 ? DEFAULT_SCALES : scales;
  }

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectDto> {
    const dimensions = this.getDimensions(createProjectDto.dimensions);
    const scales = this.getScales(createProjectDto.scales);

    // Handle role at service level
    const ownerRole = await this.roleService.findOrCreate('owner');

    return this.projectRepository.create(
      { ...createProjectDto, dimensions, scales } as CreateProjectDto,
      userId,
      ownerRole.id,
    );
  }

  async findAllPaginated(
    page: number,
    limit: number,
    userId: string,
  ): Promise<PaginatedResponse<ProjectDto>> {
    const skip = (page - 1) * limit;
    const [projects, total] = await this.projectRepository.findAllPaginated(
      skip,
      limit,
      userId,
    );

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne(id);
    if (!project) {
      throw new ResourceNotFoundException('Project', id);
    }
    return project;
  }

  async remove(id: string): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne(id);
    if (!project) {
      throw new ResourceNotFoundException('Project', id);
    }
    return this.projectRepository.remove(id);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne(id);
    if (!project) {
      throw new ResourceNotFoundException('Project', id);
    }
    return this.projectRepository.update(id, updateProjectDto);
  }

  async getProjectTags(id: string): Promise<TagDto[]> {
    const project = await this.projectRepository.findOne(id);
    if (!project) {
      throw new ResourceNotFoundException('Project', id);
    }
    return this.projectRepository.getProjectTags(id);
  }

  async createTag(projectId: string, dto: CreateTagDto) {
    const project = await this.projectRepository.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.projectRepository.createTag(projectId, dto);
  }

  async removeProjectTag(projectId: string, tagId: string): Promise<TagDto> {
    const project = await this.projectRepository.findOne(projectId);
    if (!project) {
      throw new ResourceNotFoundException('Project', projectId);
    }

    const tag = await this.projectRepository.findProjectTag(projectId, tagId);

    if (!tag) {
      throw new ResourceNotFoundException('Tag', tagId);
    }

    return this.projectRepository.removeTag(projectId, tagId);
  }

  async updateUserRole(
    projectId: string,
    userId: string,
    roleName: string,
    requestingUserId: string,
  ): Promise<UserRoleResponseDto> {
    // Verificar que el proyecto existe
    const project = await this.projectRepository.findOne(projectId);
    if (!project) {
      throw new ResourceNotFoundException('Project', projectId);
    }

    // Prevenir que un usuario cambie su propio rol
    if (userId === requestingUserId) {
      throw new NotFoundException(
        'No puedes cambiar tu propio rol en el proyecto',
      );
    }

    // Obtener el rol por nombre
    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    // Actualizar el rol del usuario
    return this.projectRepository.updateUserRole(projectId, userId, role.id);
  }

  async getProjectUsers(projectId: string): Promise<ProjectUserDto[]> {
    const project = await this.projectRepository.findOne(projectId);
    if (!project) {
      throw new ResourceNotFoundException('Project', projectId);
    }

    return this.projectRepository.getProjectUsers(projectId);
  }

  async removeUserFromProject(
    projectId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<ProjectUserDto> {
    const project = await this.projectRepository.findOne(projectId);
    if (!project) {
      throw new ResourceNotFoundException('Project', projectId);
    }

    if (userId === requestingUserId) {
      throw new ForbiddenException(
        'No puedes eliminarte a ti mismo del proyecto',
      );
    }

    return this.projectRepository.removeUserFromProject(projectId, userId);
  }
}
