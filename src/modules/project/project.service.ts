import { DimensionDto } from '@common/dto/dimension.dto';
import {
  ResourceNotFoundException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
import { CacheService } from '@common/services/cache.service';
import { PaginatedResponse } from '@common/types/responses';
import { getProjectValidationConfig } from '@config/project-validation.config';
import { AiService } from '@modules/ai/ai.service';
import { FileService } from '@modules/files/file.service';
import { MandalaService } from '@modules/mandala/mandala.service';
import { RoleService } from '@modules/role/role.service';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
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
import { AiSolutionResponse } from './types/solutions.type';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private projectRepository: ProjectRepository,
    private roleService: RoleService,
    private aiService: AiService,
    @Inject(forwardRef(() => MandalaService))
    private mandalaService: MandalaService,
    private fileService: FileService,
    private cacheService: CacheService,
  ) {}

  private getDimensions(dimensions?: DimensionDto[]): DimensionDto[] {
    return !dimensions || dimensions.length === 0
      ? DEFAULT_DIMENSIONS
      : dimensions;
  }

  private getScales(scales?: string[]): string[] {
    return !scales || scales.length === 0 ? DEFAULT_SCALES : scales;
  }

  private async checkMinimalConditionsForSolutions(
    project: ProjectDto,
    projectId: string,
  ): Promise<void> {
    const config = getProjectValidationConfig();

    if (!project.description || project.description.trim().length === 0) {
      throw new BadRequestException(
        'Project description is required to generate solutions. Please add a description to the project first.',
      );
    }

    if (project.configuration.dimensions.length === 0) {
      throw new BadRequestException(
        'Project dimensions are required to generate solutions. Please add dimensions to the project first.',
      );
    }

    if (project.configuration.scales.length === 0) {
      throw new BadRequestException(
        'Project scales are required to generate solutions. Please add scales to the project first.',
      );
    }

    const mandalas = await this.mandalaService.findAll(projectId);
    if (mandalas.length < config.minMandalasForSolutions) {
      throw new BadRequestException(
        `Project must have at least ${config.minMandalasForSolutions} mandalas to generate solutions. Please add more mandalas to the project first.`,
      );
    }
    const totalPostitsCount =
      await this.mandalaService.countPostitsAcrossMandalas(mandalas);
    if (totalPostitsCount < config.minPostitsForSolutions) {
      throw new BadRequestException(
        `Project must have at least ${config.minPostitsForSolutions} postits across all mandalas to generate solutions. Please add more postits to your mandalas first.`,
      );
    }

    const projectFilesCount =
      await this.fileService.countProjectFiles(projectId);
    if (projectFilesCount < config.minFilesForSolutions) {
      throw new BadRequestException(
        `Project must have at least ${config.minFilesForSolutions} files to generate solutions. Please add more files to the project first.`,
      );
    }
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

    return this.projectRepository.removeWithCascade(id);
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
  ): Promise<UserRoleResponseDto> {
    // Verificar que el proyecto existe
    const project = await this.projectRepository.findOne(projectId);
    if (!project) {
      throw new ResourceNotFoundException('Project', projectId);
    }

    // Obtener el rol por nombre
    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    const currentUserRole = await this.projectRepository.getUserRole(
      project.id,
      userId,
    );
    if (!currentUserRole) {
      throw new ResourceNotFoundException(
        'ProjectUser',
        `${project.id}:${userId}`,
      );
    }

    const isCurrentlyOwner = currentUserRole?.name === 'owner';
    const willBeOwner = role.name === 'owner';
    const isDowngradeFromOwner = isCurrentlyOwner && !willBeOwner;

    if (isDowngradeFromOwner) {
      const ownersCount = await this.projectRepository.countOwners(projectId);

      if (ownersCount <= 1) {
        throw new StateConflictException('owner', 'downgrade', {
          reason: 'last_owner',
        });
      }
    }

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

  async generateSolutions(
    userId: string,
    projectId: string,
    selectedFiles?: string[],
  ): Promise<AiSolutionResponse[]> {
    this.logger.log(`generateSolutions called for project ${projectId}`);
    const project = await this.findOne(projectId);

    await this.checkMinimalConditionsForSolutions(project, projectId);

    const projectMandalas = await this.mandalaService.findAll(projectId);
    const mandalasDocument = await Promise.all(
      projectMandalas.map((m) =>
        this.mandalaService.getFirestoreDocument(m.projectId, m.id),
      ),
    );

    const solutions = await this.aiService.generateSolutions(
      projectId,
      project.name,
      project.description!,
      project.configuration.dimensions.map((d) => d.name),
      project.configuration.scales,
      mandalasDocument,
      selectedFiles,
    );

    await this.saveSolutionsToCache(userId, projectId, solutions);

    return solutions;
  }

  private async saveSolutionsToCache(
    userId: string,
    projectId: string,
    solutions: AiSolutionResponse[],
  ): Promise<void> {
    const cacheKey = this.cacheService.buildCacheKey(
      'solutions',
      userId,
      projectId,
    );

    for (const solution of solutions) {
      await this.cacheService.addToLimitedCache(cacheKey, solution, 20);
    }
    this.logger.log(
      `Saved solutions to cache for user ${userId}, project ${projectId}`,
    );
  }

  async getCachedSolutions(
    userId: string,
    projectId: string,
  ): Promise<AiSolutionResponse[]> {
    const cacheKey = this.cacheService.buildCacheKey(
      'solutions',
      userId,
      projectId,
    );
    return this.cacheService.getFromCache<AiSolutionResponse>(cacheKey);
  }
}
