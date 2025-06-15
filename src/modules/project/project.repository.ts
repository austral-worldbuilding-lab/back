import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDto } from './dto/project.dto';
import { Prisma, Project } from '@prisma/client';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectConfiguration } from './types/project-configuration.type';
import { TagDto } from './dto/tag.dto';
import { TagResponseDto } from './dto/tagResponse.dto';

@Injectable()
export class ProjectRepository {
  constructor(private prisma: PrismaService) {}

  private parseToProjectConfiguration(
    config: Prisma.JsonValue,
  ): ProjectConfiguration {
    const parsedConfig = config as unknown as ProjectConfiguration;

    return {
      dimensions: parsedConfig.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: parsedConfig.scales,
    };
  }

  private parseToJson(config: ProjectConfiguration): Prisma.InputJsonValue {
    return {
      dimensions: config.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: config.scales,
    };
  }

  private parseToProjectDto(project: Project): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      configuration: this.parseToProjectConfiguration(project.configuration),
      createdAt: project.createdAt,
    };
  }

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
    roleId: string,
  ): Promise<ProjectDto> {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          configuration: this.parseToJson({
            dimensions: createProjectDto.dimensions!,
            scales: createProjectDto.scales!,
          }),
        },
      });

      await tx.userProjectRole.create({
        data: {
          userId,
          projectId: project.id,
          roleId: roleId,
        },
      });

      return this.parseToProjectDto(project);
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
  ): Promise<[ProjectDto[], number]> {
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count(),
    ]);

    return [projects.map((project) => this.parseToProjectDto(project)), total];
  }

  async findOne(id: string): Promise<ProjectDto | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return null;
    }

    return this.parseToProjectDto(project);
  }

  async remove(id: string): Promise<ProjectDto> {
    const project = await this.prisma.project.delete({
      where: { id },
    });

    return this.parseToProjectDto(project);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        configuration: this.parseToJson({
          dimensions: updateProjectDto.dimensions!,
          scales: updateProjectDto.scales!,
        }),
      },
    });

    return this.parseToProjectDto(project);
  }

  async getProjectTags(projectId: string): Promise<TagDto[]> {
    return this.prisma.tag.findMany({
      where: { projectId },
    });
  }

  async createTag(projectId: string, dto: TagDto): Promise<TagResponseDto> {
    const tag = await this.prisma.tag.upsert({
      where: { name: dto.name },
      update: {},
      create: { name: dto.name, color: dto.color },
    });

    const projectTag = await this.prisma.projectTag.create({
      data: {
        projectId,
        tagId: tag.id,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      projectId: projectTag.projectId,
    };
  }
}
