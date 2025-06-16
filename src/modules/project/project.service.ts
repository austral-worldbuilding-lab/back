import { Injectable, NotFoundException } from '@nestjs/common';
import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectRepository } from './project.repository';
import { ProjectDto } from './dto/project.dto';
import { PaginatedResponse } from '@common/types/responses';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DEFAULT_DIMENSIONS, DEFAULT_SCALES } from './resources/default-values';
import { DimensionDto } from '@common/dto/dimension.dto';
import { TagDto } from './dto/tag.dto';
import { RoleService } from '@modules/role/role.service';
import { CreateTagDto } from './dto/create-tag.dto';

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
  ): Promise<PaginatedResponse<ProjectDto>> {
    const skip = (page - 1) * limit;
    const [projects, total] = await this.projectRepository.findAllPaginated(
      skip,
      limit,
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
}
