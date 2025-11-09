import { CacheService } from '@common/services/cache.service';
import { AppLogger } from '@common/services/logger.service';
import { ProjectService } from '@modules/project/project.service';
import { SolutionsQueueService } from '@modules/queue/services/solutions-queue.service';
import { SolutionsJobStatusResponse } from '@modules/queue/types/solutions-job.types';
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';

import { ActionItemDto } from './dto/action-item.dto';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { SolutionDto } from './dto/solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { SolutionRepository } from './solution.repository';
import { AiSolutionResponse } from './types/solutions.type';

@Injectable()
export class SolutionService {
  constructor(
    private solutionRepository: SolutionRepository,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    @Inject(forwardRef(() => SolutionsQueueService))
    private solutionsQueueService: SolutionsQueueService,
    private cacheService: CacheService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SolutionService.name);
  }

  async create(
    projectId: string,
    createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    const project = await this.projectService.findOne(projectId);

    const isRootProject = await this.projectService.isRoot(projectId);
    if (!isRootProject) {
      throw new BadRequestException(
        'Solutions can only be created for root projects (projects without a parent)',
      );
    }

    await this.projectService.checkMinimalConditionsForSolutions(
      project,
      projectId,
    );

    return this.solutionRepository.create(projectId, createSolutionDto);
  }

  async findAll(projectId: string): Promise<SolutionDto[]> {
    await this.projectService.findOne(projectId);

    return this.solutionRepository.findAll(projectId);
  }

  async findOne(id: string): Promise<SolutionDto> {
    const solution = await this.solutionRepository.findOne(id);
    if (!solution) {
      throw new NotFoundException(`Solution with ID ${id} not found`);
    }
    return solution;
  }

  async remove(id: string): Promise<SolutionDto> {
    const solution = await this.solutionRepository.findOne(id);
    if (!solution) {
      throw new NotFoundException(`Solution with ID ${id} not found`);
    }

    return this.solutionRepository.remove(id);
  }

  async update(
    id: string,
    updateSolutionDto: UpdateSolutionDto,
  ): Promise<SolutionDto> {
    const solution = await this.solutionRepository.findOne(id);
    if (!solution) {
      throw new NotFoundException(`Solution with ID ${id} not found`);
    }

    return this.solutionRepository.update(id, updateSolutionDto);
  }

  /**
   * Queue solutions generation job
   * @param projectId - The project ID
   * @param userId - The user ID who requested the generation
   * @param organizationId - The organization ID
   * @returns Job ID for tracking
   */
  async queueSolutionsGeneration(
    projectId: string,
    userId: string,
    organizationId?: string,
  ): Promise<string> {
    await this.projectService.findOne(projectId);

    const jobId = await this.solutionsQueueService.addSolutionsJob(
      projectId,
      userId,
      organizationId,
    );

    return jobId;
  }

  /**
   * Get solutions job status by project ID
   * Returns the active/waiting job for this project
   */
  async getSolutionsJobStatus(
    projectId: string,
  ): Promise<SolutionsJobStatusResponse> {
    return this.solutionsQueueService.getJobStatusByProjectId(projectId);
  }

  /**
   * Save solutions to cache
   * @param projectId - The project ID
   * @param solutions - The solutions to save
   */
  async saveSolutionsToCache(
    projectId: string,
    solutions: AiSolutionResponse[],
  ): Promise<void> {
    const cacheKey = this.cacheService.buildProjectCacheKey(
      'solutions',
      projectId,
    );

    for (const solution of solutions) {
      await this.cacheService.addToLimitedCache(cacheKey, solution, 20);
    }
    this.logger.log(`Saved solutions to cache for project ${projectId}`);
  }

  /**
   * Get cached solutions for a project
   * @param projectId - The project ID
   * @returns Array of cached solutions
   */
  async getCachedSolutions(projectId: string): Promise<AiSolutionResponse[]> {
    const cacheKey = this.cacheService.buildProjectCacheKey(
      'solutions',
      projectId,
    );
    return this.cacheService.getFromCache<AiSolutionResponse>(cacheKey);
  }

  /**
   * Save action items to a solution
   * @param solutionId - The solution ID
   * @param actionItems - The action items to save
   * @returns Updated solution with action items
   */
  async saveActionItems(
    solutionId: string,
    actionItems: ActionItemDto[],
  ): Promise<SolutionDto> {
    const solution = await this.solutionRepository.findOne(solutionId);
    if (!solution) {
      throw new NotFoundException(`Solution with ID ${solutionId} not found`);
    }

    return this.solutionRepository.updateActionItems(solutionId, actionItems);
  }
}
