import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectRepository } from './project.repository';
import { ProjectDto } from './dto/project.dto';
import { PaginatedResponse } from '../common/types/responses';

@Injectable()
export class ProjectService {
  constructor(private projectRepository: ProjectRepository) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectDto> {
    return this.projectRepository.create(createProjectDto, userId);
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
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async remove(id: string): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.projectRepository.remove(id);
  }
}
