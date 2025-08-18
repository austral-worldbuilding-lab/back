import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma, Project, Tag } from '@prisma/client';

import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { ProjectUserDto } from './dto/project-user.dto';
import { ProjectDto } from './dto/project.dto';
import { TagDto } from './dto/tag.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRoleResponseDto } from './dto/user-role-response.dto';
import { ProjectConfiguration } from './types/project-configuration.type';

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
      description: project.description ?? undefined,
      configuration: this.parseToProjectConfiguration(project.configuration),
      createdAt: project.createdAt,
    };
  }

  private parseToTagDto(tag: Tag): TagDto {
    return {
      name: tag.name,
      color: tag.color,
    } as TagDto;
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
          description: createProjectDto.description,
          configuration: this.parseToJson({
            dimensions: createProjectDto.dimensions!,
            scales: createProjectDto.scales!,
          }),
          ...(createProjectDto.organizationId
            ? { organizationId: createProjectDto.organizationId }
            : {}),
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
    userId: string,
  ): Promise<[ProjectDto[], number]> {
    const whereClause = {
      isActive: true,
      userRoles: {
        some: {
          userId: userId,
        },
      },
    };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({
        where: whereClause,
      }),
    ]);

    return [projects.map((project) => this.parseToProjectDto(project)), total];
  }

  async findOne(id: string): Promise<ProjectDto | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!project) {
      return null;
    }

    return this.parseToProjectDto(project);
  }

  async remove(id: string): Promise<ProjectDto> {
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
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
        description: updateProjectDto.description,
        configuration: this.parseToJson({
          dimensions: updateProjectDto.dimensions!,
          scales: updateProjectDto.scales!,
        }),
        ...(updateProjectDto.organizationId
          ? { organizationId: updateProjectDto.organizationId }
          : {}),
      },
    });

    return this.parseToProjectDto(project);
  }

  async getProjectTags(projectId: string): Promise<TagDto[]> {
    return this.prisma.tag.findMany({
      where: {
        projectId,
        isActive: true,
      },
    });
  }

  async createTag(projectId: string, dto: CreateTagDto): Promise<TagDto> {
    return this.prisma.$transaction(async (tx) => {
      const existingSoftDeletedTag = await tx.tag.findFirst({
        where: {
          name: dto.name,
          projectId,
          isActive: false,
        },
      });

      if (existingSoftDeletedTag) {
        return tx.tag.update({
          where: { id: existingSoftDeletedTag.id },
          data: {
            isActive: true,
            deletedAt: null,
            color: dto.color,
          },
        });
      }

      return tx.tag.create({
        data: {
          name: dto.name,
          color: dto.color,
          projectId,
        },
      });
    });
  }

  async findProjectTag(projectId: string, tagId: string): Promise<Tag | null> {
    return this.prisma.tag.findFirst({
      where: {
        id: tagId,
        projectId: projectId,
        isActive: true,
      },
    });
  }

  async removeTag(projectId: string, tagId: string): Promise<TagDto> {
    const deletedTag = await this.prisma.tag.update({
      where: {
        id: tagId,
        projectId: projectId,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return this.parseToTagDto(deletedTag);
  }

  async updateUserRole(
    projectId: string,
    userId: string,
    roleId: string,
  ): Promise<UserRoleResponseDto> {
    // Verificar que el usuario existe en el proyecto
    const existingUserRole = await this.prisma.userProjectRole.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        role: true,
      },
    });

    if (!existingUserRole) {
      throw new ResourceNotFoundException('User', userId, 'en el proyecto');
    }

    // Actualizar el rol del usuario
    const updatedUserRole = await this.prisma.userProjectRole.update({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      data: {
        roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        role: true,
      },
    });

    return {
      userId: updatedUserRole.userId,
      projectId: updatedUserRole.projectId,
      role: updatedUserRole.role.name,
      user: updatedUserRole.user,
    };
  }

  async getProjectUsers(projectId: string): Promise<ProjectUserDto[]> {
    const userRoles = await this.prisma.userProjectRole.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            is_active: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          username: 'asc',
        },
      },
    });

    return userRoles.map((userRole) => ({
      id: userRole.user.id,
      username: userRole.user.username,
      email: userRole.user.email,
      role: userRole.role.name,
      isActive: userRole.user.is_active,
    }));
  }

  async removeUserFromProject(
    projectId: string,
    userId: string,
  ): Promise<ProjectUserDto> {
    // Verificar que el usuario existe en el proyecto
    const existingUserRole = await this.prisma.userProjectRole.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            is_active: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingUserRole) {
      throw new ResourceNotFoundException('User', userId, 'en el proyecto');
    }

    // Eliminar la relación usuario-proyecto
    await this.prisma.userProjectRole.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return {
      id: existingUserRole.user.id,
      username: existingUserRole.user.username,
      email: existingUserRole.user.email,
      role: existingUserRole.role.name,
      isActive: existingUserRole.user.is_active,
    };
  }

  async findAllByOrganizationPaginated(
    organizationId: string,
    skip: number,
    take: number,
  ): Promise<[ProjectDto[], number]> {
    const whereClause: Prisma.ProjectWhereInput = {
      isActive: true,
      organizationId,
    };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where: whereClause }),
    ]);

    return [projects.map((project) => this.parseToProjectDto(project)), total];
  }
}
