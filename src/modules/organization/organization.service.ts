import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PaginatedResponse } from '@common/types/responses';
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
