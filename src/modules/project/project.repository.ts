import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDto } from './dto/project.dto';
import { TagDto } from './dto/tag.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ProjectRepository {
  constructor(private prisma: PrismaService) {}

  async findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async createRole(name: string): Promise<Role> {
    return this.prisma.role.create({
      data: { name },
    });
  }

  async findOrCreateRole(name: string): Promise<Role> {
    const role = await this.findRoleByName(name);
    if (role) {
      return role;
    }
    return this.createRole(name);
  }

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectDto> {
    return this.prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
        },
      });

      // Find or create owner role
      const ownerRole = await this.findOrCreateRole('owner');

      // Create user-project-role relation
      await tx.userProjectRole.create({
        data: {
          userId,
          projectId: project.id,
          roleId: ownerRole.id,
        },
      });

      return project;
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

    return [projects, total];
  }

  async findOne(id: string): Promise<ProjectDto | null> {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }

  async remove(id: string): Promise<ProjectDto> {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getProjectTags(projectId: string, userId: string): Promise<TagDto[]> {
    const userProject = await this.prisma.userProjectRole.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!userProject) {
      return [];
    }

    const projectTags = await this.prisma.projectTag.findMany({
      where: { projectId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return projectTags.map((projectTag) => ({
      name: projectTag.tag.name,
      color: projectTag.tag.color,
    }));
  }
}
