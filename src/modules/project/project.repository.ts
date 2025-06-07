import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDto } from './dto/project.dto';
import { Role } from '@prisma/client';
import { UpdateProjectDto } from './dto/update-project.dto';

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
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          dimensions: createProjectDto.dimensions,
          scales: createProjectDto.scales,
        },
        select: {
          id: true,
          name: true,
          dimensions: true,
          scales: true,
          createdAt: true,
        },
      });

      const ownerRole: Role = await this.findOrCreateRole('owner');

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
        select: {
          id: true,
          name: true,
          dimensions: true,
          scales: true,
          createdAt: true,
        },
      }),
      this.prisma.project.count(),
    ]);

    return [projects, total];
  }

  async findOne(id: string): Promise<ProjectDto | null> {
    return this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        dimensions: true,
        scales: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string): Promise<ProjectDto> {
    return this.prisma.project.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        dimensions: true,
        scales: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    return this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        dimensions: updateProjectDto.dimensions,
        scales: updateProjectDto.scales,
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        scales: true,
        createdAt: true,
      },
    });
  }
}
