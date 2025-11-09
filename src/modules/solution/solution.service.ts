import { AppLogger } from '@common/services/logger.service';
import { ProjectService } from '@modules/project/project.service';
import { SolutionsQueueService } from '@modules/queue/services/solutions-queue.service';
import { SolutionsJobStatusResponse } from '@modules/queue/types/solutions-job.types';
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
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
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SolutionService.name);
  }

  async create(
    projectId: string,
    createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    const project = await this.projectService.findOne(projectId);

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
   * Save solutions to database
   * @param projectId - The project ID
   * @param solutions - The solutions to save
   */
  async saveSolutionsToDatabase(
    projectId: string,
    solutions: AiSolutionResponse[],
  ): Promise<SolutionDto[]> {
    const savedSolutions: SolutionDto[] = [];

    for (const aiSolution of solutions) {
      const createSolutionDto: CreateSolutionDto = {
        title: aiSolution.title,
        description: aiSolution.description,
        problem: aiSolution.problem,
        impact: {
          level: aiSolution.impactLevel.toLowerCase() as
            | 'low'
            | 'medium'
            | 'high',
          description: aiSolution.impactDescription,
        },
      };

      const savedSolution = await this.solutionRepository.create(
        projectId,
        createSolutionDto,
      );
      savedSolutions.push(savedSolution);
    }

    this.logger.log(
      `Saved ${savedSolutions.length} solutions to database for project ${projectId}`,
    );
    return savedSolutions;
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
