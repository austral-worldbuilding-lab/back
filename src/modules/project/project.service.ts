import { DimensionDto } from '@common/dto/dimension.dto';
import {
  ResourceNotFoundException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
import { CacheService } from '@common/services/cache.service';
import { AppLogger } from '@common/services/logger.service';
import { PaginatedResponse } from '@common/types/responses';
import { getProjectValidationConfig } from '@config/project-validation.config';
import { AiService } from '@modules/ai/ai.service';
import { UploadContextDto } from '@modules/files/dto/upload-context.dto';
import { FileService } from '@modules/files/file.service';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { MandalaService } from '@modules/mandala/mandala.service';
import { EncyclopediaQueueService } from '@modules/queue/services/encyclopedia-queue.service';
import { EncyclopediaJobStatusResponse } from '@modules/queue/types/encyclopedia-job.types';
import { RoleService } from '@modules/role/role.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';

import { CreateProjectFromProvocationDto } from './dto/create-project-from-provocation.dto';
import { CreateProjectFromQuestionDto } from './dto/create-project-from-question.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProvocationDto } from './dto/create-provocation.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { ProjectUserDto } from './dto/project-user.dto';
import { ProjectDto } from './dto/project.dto';
import { ProvocationDto } from './dto/provocation.dto';
import { TagDto } from './dto/tag.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRoleResponseDto } from './dto/user-role-response.dto';
import { ProjectRepository } from './project.repository';
import { DEFAULT_DIMENSIONS, DEFAULT_SCALES } from './resources/default-values';
import { AiProvocationResponse } from './types/provocations.type';
import { TimelineGraph } from './types/timeline.type';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private roleService: RoleService,
    private aiService: AiService,
    @Inject(forwardRef(() => MandalaService))
    private mandalaService: MandalaService,
    private fileService: FileService,
    private cacheService: CacheService,
    private readonly logger: AppLogger,
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly textStorageService: TextStorageService,
    @Inject(forwardRef(() => EncyclopediaQueueService))
    private readonly encyclopediaQueueService: EncyclopediaQueueService,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  private getDimensions(dimensions?: DimensionDto[]): DimensionDto[] {
    return !dimensions || dimensions.length === 0
      ? DEFAULT_DIMENSIONS
      : dimensions;
  }

  private getScales(scales?: string[]): string[] {
    return !scales || scales.length === 0 ? DEFAULT_SCALES : scales;
  }

  private async checkMinimalConditionsForProvocations(
    project: ProjectDto,
    projectId: string,
  ): Promise<void> {
    const config = getProjectValidationConfig();

    if (!project.description || project.description.trim().length === 0) {
      throw new BadRequestException(
        'Project description is required to generate provocations. Please add a description to the project first.',
      );
    }

    if (project.configuration.dimensions.length === 0) {
      throw new BadRequestException(
        'Project dimensions are required to generate provocations. Please add dimensions to the project first.',
      );
    }

    if (project.configuration.scales.length === 0) {
      throw new BadRequestException(
        'Project scales are required to generate provocations. Please add scales to the project first.',
      );
    }

    const mandalas = await this.mandalaService.findAll(projectId);
    if (mandalas.length < config.minMandalasForProvocations) {
      throw new BadRequestException(
        `Project must have at least ${config.minMandalasForProvocations} mandalas to generate provocations. Please add more mandalas to the project first.`,
      );
    }
    const totalPostitsCount =
      await this.mandalaService.countPostitsAcrossMandalas(mandalas);
    if (totalPostitsCount < config.minPostitsForProvocations) {
      throw new BadRequestException(
        `Project must have at least ${config.minPostitsForProvocations} postits across all mandalas to generate provocations. Please add more postits to your mandalas first.`,
      );
    }

    const projectFilesCount =
      await this.fileService.countProjectFiles(projectId);
    if (projectFilesCount < config.minFilesForProvocations) {
      throw new BadRequestException(
        `Project must have at least ${config.minFilesForProvocations} files to generate provocations. Please add more files to the project first.`,
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

    const project: ProjectDto = await this.projectRepository.create(
      { ...createProjectDto, dimensions, scales } as CreateProjectDto,
      userId,
      ownerRole.id,
    );

    await this.projectRepository.autoAssignOrganizationMembers(
      project.id,
      createProjectDto.organizationId,
    );

    return project;
  }

  async createFromProvocation(
    createProjectFromProvocationDto: CreateProjectFromProvocationDto,
    userId: string,
  ): Promise<ProjectDto> {
    const ownerRole = await this.roleService.findOrCreate('owner');

    const parentProject =
      await this.projectRepository.findGeneratedProjectByProvocation(
        createProjectFromProvocationDto.fromProvocationId,
      );

    if (
      parentProject &&
      parentProject.organizationId !==
        createProjectFromProvocationDto.organizationId
    ) {
      throw new BadRequestException(
        `Organization ID must match parent project's organization (${parentProject.organizationId}).`,
      );
    }

    const project: ProjectDto =
      await this.projectRepository.createFromProvocation(
        createProjectFromProvocationDto,
        userId,
        ownerRole.id,
      );

    if (parentProject) {
      await this.projectRepository.copyProjectMembersFromParent(
        project.id,
        parentProject.id,
        userId,
        ownerRole.id,
      );
    } else {
      await this.projectRepository.autoAssignOrganizationMembers(
        project.id,
        project.organizationId,
      );
    }

    return project;
  }

  async createFromQuestion(
    createProjectFromQuestionDto: CreateProjectFromQuestionDto,
    userId: string,
  ): Promise<ProjectDto> {
    const ownerRole = await this.roleService.findOrCreate('owner');

    const project: ProjectDto = await this.projectRepository.createFromQuestion(
      createProjectFromQuestionDto,
      userId,
      ownerRole.id,
    );

    await this.projectRepository.autoAssignOrganizationMembers(
      project.id,
      project.organizationId,
    );

    return project;
  }

  async findAllPaginated(
    page: number,
    limit: number,
    userId: string,
    rootOnly: boolean = false,
  ): Promise<PaginatedResponse<ProjectDto>> {
    const skip = (page - 1) * limit;
    const [projects, total] = await this.projectRepository.findAllPaginated(
      skip,
      limit,
      userId,
      rootOnly,
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

  async generateProvocations(
    userId: string,
    projectId: string,
    selectedFiles?: string[],
  ): Promise<AiProvocationResponse[]> {
    this.logger.log(`generateProvocations called for project ${projectId}`);
    const project = await this.findOne(projectId);

    await this.checkMinimalConditionsForProvocations(project, projectId);

    const projectMandalas = await this.mandalaService.findAll(projectId);
    const mandalasDocument = await Promise.all(
      projectMandalas.map((m) =>
        this.mandalaService.getFirestoreDocument(m.projectId, m.id),
      ),
    );

    const mandalasSummariesWithAi: string =
      this.mandalaService.getAllMandalaSummaries(
        projectId,
        mandalasDocument,
        projectMandalas,
      );

    const provocations = await this.aiService.generateProvocations(
      projectId,
      project.name,
      project.description!,
      project.configuration.dimensions.map((d) => d.name),
      project.configuration.scales,
      mandalasDocument,
      mandalasSummariesWithAi,
      selectedFiles,
    );

    await this.saveProvocationsToCache(userId, projectId, provocations);

    return provocations;
  }

  private async saveProvocationsToCache(
    userId: string,
    projectId: string,
    provocations: AiProvocationResponse[],
  ): Promise<void> {
    const cacheKey = this.cacheService.buildCacheKey(
      'provocations',
      userId,
      projectId,
    );

    for (const provocation of provocations) {
      await this.cacheService.addToLimitedCache(cacheKey, provocation, 20);
    }
    this.logger.log(
      `Saved provocations to cache for user ${userId}, project ${projectId}`,
    );
  }

  async getCachedProvocations(
    userId: string,
    projectId: string,
  ): Promise<AiProvocationResponse[]> {
    const cacheKey = this.cacheService.buildCacheKey(
      'provocations',
      userId,
      projectId,
    );
    return this.cacheService.getFromCache<AiProvocationResponse>(cacheKey);
  }

  async createProvocation(
    projectId: string,
    createProvocationDto: CreateProvocationDto,
  ): Promise<ProvocationDto> {
    const project = await this.findOne(projectId);

    await this.checkMinimalConditionsForProvocations(project, projectId);

    return this.projectRepository.createProvocation(
      projectId,
      createProvocationDto,
    );
  }

  async findAllProvocations(projectId: string): Promise<ProvocationDto[]> {
    await this.findOne(projectId);

    return this.projectRepository.findAllProvocationsByProjectId(projectId);
  }

  async getTimeline(projectId: string): Promise<TimelineGraph> {
    const project = await this.findOne(projectId);

    return this.projectRepository.getTimelineGraph(
      project.organizationId,
      projectId,
    );
  }

  async isRoot(projectId: string): Promise<boolean> {
    const project =
      await this.projectRepository.findProjectWithParent(projectId);
    return project?.parentProjectId === null;
  }

  /**
   * Queue encyclopedia generation job
   * @param projectId - The project ID
   * @param selectedFiles - Optional files to include in generation
   * @returns Job ID for tracking
   */
  async queueEncyclopediaGeneration(
    projectId: string,
    selectedFiles?: string[],
  ): Promise<string> {
    this.logger.log(
      `Queuing encyclopedia generation job for project ${projectId}`,
    );
    await this.findOne(projectId);

    const jobId = await this.encyclopediaQueueService.addEncyclopediaJob(
      projectId,
      selectedFiles,
    );

    this.logger.log(
      `Encyclopedia generation job queued for project ${projectId} with ID: ${jobId}`,
    );

    return jobId;
  }

  /**
   * Get encyclopedia job status by project ID
   * Returns the active/waiting job for this project
   */
  async getEncyclopediaJobStatus(
    projectId: string,
  ): Promise<EncyclopediaJobStatusResponse> {
    return this.encyclopediaQueueService.getJobStatusByProjectId(projectId);
  }

  /**
   * DEPRECATED: Old synchronous encyclopedia generation
   * This method is kept for reference but should not be used directly.
   * Use queueEncyclopediaGeneration instead.
   *
   * @deprecated Use queueEncyclopediaGeneration for async job-based generation
   */
  async generateEncyclopedia(
    projectId: string,
    selectedFiles?: string[],
  ): Promise<{ encyclopedia: string; storageUrl: string }> {
    this.logger.log(
      `[DEPRECATED] Starting synchronous encyclopedia generation for project ${projectId}`,
    );

    const project = await this.findOne(projectId);

    const mandalasWithStatus =
      await this.mandalaService.getMandalasWithSummaryStatus(projectId);

    const withoutSummary = mandalasWithStatus.filter(
      ({ hasSummary }) => !hasSummary,
    );
    const allMandalas = mandalasWithStatus.map(({ mandala }) => mandala);

    this.logger.log(
      `Found ${withoutSummary.length} mandalas without summaries out of ${allMandalas.length} total mandalas`,
    );

    // Generate missing summaries in parallel
    if (withoutSummary.length > 0) {
      this.logger.log(
        `Generating summaries for ${withoutSummary.length} mandalas...`,
      );

      await Promise.all(
        withoutSummary.map(({ mandala }) =>
          this.mandalaService
            .generateSummaryReport(mandala.id)
            .catch((error) => {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              this.logger.error(
                `Failed to generate summary for mandala ${mandala.id}: ${errorMessage}`,
              );
              // Continue with other summaries even if one fails
              return null;
            }),
        ),
      );

      this.logger.log(
        `Completed summary generation for mandalas without summaries`,
      );
    }

    const allDimensions = [
      ...new Set(
        allMandalas.flatMap((m) =>
          m.configuration.dimensions.map((d) => d.name),
        ),
      ),
    ];

    const allScales = [
      ...new Set(allMandalas.flatMap((m) => m.configuration.scales)),
    ];

    // Join all summaries
    const allSummaries =
      await this.mandalaService.getAllMandalaSummariesByProjectId(projectId);

    if (!allSummaries) {
      this.logger.warn(`No summaries available for project ${projectId}`);
    }

    // Generate encyclopedia
    this.logger.log(`Generating encyclopedia content for project ${projectId}`);
    const encyclopediaResponse = await this.aiService.generateEncyclopedia(
      projectId,
      project.name,
      project.description || '',
      allDimensions,
      allScales,
      allSummaries,
      selectedFiles,
    );

    //TODO what happens if we have multiple encyclopedias?
    const fileName = `Enciclopedia del mundo - ${project.name}.md`;

    const storageUrl = await this.saveEncyclopedia(
      encyclopediaResponse.encyclopedia,
      project.organizationId,
      project.id,
      fileName,
    );

    this.logger.log(
      `Encyclopedia generation pipeline completed for project ${projectId}`,
    );

    return {
      encyclopedia: encyclopediaResponse.encyclopedia,
      storageUrl,
    };
  }

  async saveEncyclopedia(
    content: string,
    organizationId: string,
    projectId: string,
    fileName: string,
  ): Promise<string> {
    this.logger.log('Saving encyclopedia to blob storage', {
      organizationId,
      projectId,
      fileName,
      contentLength: content.length,
    });

    const scope = {
      orgId: organizationId,
      projectId: projectId,
    };

    const buffer = Buffer.from(content, 'utf-8');

    // Use the same approach as VideoProcessingService
    await this.blobStorageService.uploadBuffer(
      buffer,
      fileName,
      scope,
      'text/markdown',
    );

    // Get the public URL
    const publicUrl = this.blobStorageService.buildPublicUrl(
      scope,
      fileName,
      'files',
    );

    this.logger.log('Successfully saved encyclopedia', {
      organizationId,
      projectId,
      fileName,
      publicUrl,
      contentLength: content.length,
    });

    return publicUrl;
  }

  async uploadContext(
    projectId: string,
    uploadContext: UploadContextDto,
  ): Promise<string> {
    const project = await this.findOne(projectId);

    const scope = {
      orgId: project.organizationId,
      projectId,
    };

    return this.textStorageService.uploadText(
      uploadContext.content,
      uploadContext.filename,
      scope,
    );
  }
}
