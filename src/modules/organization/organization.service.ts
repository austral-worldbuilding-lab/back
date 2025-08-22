import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PaginatedResponse } from '@common/types/responses';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ProjectDto } from '@modules/project/dto/project.dto';
import { ProjectRepository } from '@modules/project/project.repository';
import { RoleService } from '@modules/role/role.service';
import { Injectable } from '@nestjs/common';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationDto } from './dto/organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private roleService: RoleService,
    private projectRepository: ProjectRepository,
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    userId: string,
  ): Promise<OrganizationDto> {
    const ownerRole = await this.roleService.findOrCreate('owner');

    return this.organizationRepository.create(dto, userId, ownerRole.id);
  }

  async findAllPaginated(
    page: number,
    limit: number,
    userId: string,
  ): Promise<PaginatedResponse<OrganizationDto>> {
    const skip = (page - 1) * limit;
    const [orgs, total] = await this.organizationRepository.findAllPaginated(
      skip,
      limit,
      userId,
    );

    return {
      data: orgs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<OrganizationDto> {
    const org = await this.organizationRepository.findOne(id);
    if (!org) {
      throw new ResourceNotFoundException('Organization', id);
    }
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDto> {
    const org = await this.organizationRepository.findOne(id);
    if (!org) {
      throw new ResourceNotFoundException('Organization', id);
    }
    return this.organizationRepository.update(id, dto);
  }

  async remove(id: string): Promise<OrganizationDto> {
    const org = await this.organizationRepository.findOne(id);
    if (!org) {
      throw new ResourceNotFoundException('Organization', id);
    }

    // Implementar soft delete en cascada
    await this.prisma.$transaction(async (tx) => {
      // 1. Buscar todos los proyectos activos de la organización
      const activeProjects = await tx.project.findMany({
        where: {
          organizationId: id,
          isActive: true,
        },
        select: { id: true },
      });

      // 2. Soft delete de todas las mandalas de esos proyectos
      if (activeProjects.length > 0) {
        const projectIds = activeProjects.map((p) => p.id);

        await tx.mandala.updateMany({
          where: {
            projectId: { in: projectIds },
            isActive: true,
          },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        // 3. Soft delete de todos los proyectos de la organización
        await tx.project.updateMany({
          where: {
            organizationId: id,
            isActive: true,
          },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });
      }
    });

    // 4. Finalmente, soft delete de la organización
    return this.organizationRepository.remove(id);
  }

  async findOrganizationProjectsPaginated(
    id: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<ProjectDto>> {
    const org = await this.organizationRepository.findOne(id);
    if (!org) {
      throw new ResourceNotFoundException('Organization', id);
    }

    const skip = (page - 1) * limit;
    const [projects, total] =
      await this.projectRepository.findAllByOrganizationPaginated(
        id,
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
}
