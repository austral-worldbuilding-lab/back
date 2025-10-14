import { ProjectService } from '@modules/project/project.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { CreateSolutionDto } from './dto/create-solution.dto';
import { SolutionDto } from './dto/solution.dto';
import { SolutionRepository } from './solution.repository';

@Injectable()
export class SolutionService {
  constructor(
    private solutionRepository: SolutionRepository,
    private projectService: ProjectService,
  ) {}

  async create(
    projectId: string,
    createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    await this.projectService.findOne(projectId);

    const isRootProject = await this.projectService.isRoot(projectId);
    if (!isRootProject) {
      throw new BadRequestException(
        'Solutions can only be created for root projects (projects without a parent)',
      );
    }

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
}
