import {
  ResourceNotFoundException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
import { PaginatedResponse } from '@common/types/responses';
import { UploadContextDto } from '@modules/files/dto/upload-context.dto';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ProjectDto } from '@modules/project/dto/project.dto';
import { ProjectRepository } from '@modules/project/project.repository';
import { RoleService } from '@modules/role/role.service';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationUserRoleResponseDto } from './dto/organization-user-role-response.dto';
import { OrganizationUserDto } from './dto/organization-user.dto';
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
    private readonly textStorageService: TextStorageService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    userId: string,
  ): Promise<OrganizationDto> {
    const ownerRole = await this.roleService.findOrCreate('dueño');

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

    return this.organizationRepository.removeWithCascade(id);
  }

  async findOrganizationProjectsPaginated(
    id: string,
    page: number,
    limit: number,
    userId: string,
  ): Promise<PaginatedResponse<ProjectDto>> {
    const org = await this.organizationRepository.findOne(id);
    if (!org) {
      throw new ResourceNotFoundException('Organization', id);
    }

    const skip = (page - 1) * limit;
    const userOrgRole = await this.prisma.userOrganizationRole.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: id },
      },
    });

    let projects: ProjectDto[];
    let total: number;

    if (userOrgRole) {
      [projects, total] =
        await this.projectRepository.findAllByOrganizationPaginated(
          id,
          skip,
          limit,
        );
    } else {
      [projects, total] =
        await this.projectRepository.findProjectsByUserAndOrganization(
          userId,
          id,
          skip,
          limit,
        );
    }

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

  async getOrganizationUsers(
    organizationId: string,
  ): Promise<OrganizationUserDto[]> {
    const organization =
      await this.organizationRepository.findOne(organizationId);
    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    return this.organizationRepository.getOrganizationUsers(organizationId);
  }

  async updateUserRole(
    organizationId: string,
    userId: string,
    roleName: string,
  ): Promise<OrganizationUserRoleResponseDto> {
    const organization =
      await this.organizationRepository.findOne(organizationId);
    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    // Obtener el rol por nombre
    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    const currentUserRole = await this.organizationRepository.getUserRole(
      organizationId,
      userId,
    );
    if (!currentUserRole) {
      throw new ResourceNotFoundException(
        'OrganizationUser',
        `${organizationId}:${userId}`,
      );
    }

    const isCurrentlyOwner = currentUserRole?.name === 'dueño';
    const willBeOwner = role.name === 'dueño';
    const isDowngradeFromOwner = isCurrentlyOwner && !willBeOwner;

    if (isDowngradeFromOwner) {
      const ownersCount =
        await this.organizationRepository.countOwners(organizationId);

      if (ownersCount <= 1) {
        throw new StateConflictException('dueño', 'downgrade', {
          reason: 'last_owner',
        });
      }
    }

    return this.organizationRepository.updateUserRole(
      organizationId,
      userId,
      role.id,
    );
  }

  async removeUserFromOrganization(
    organizationId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<OrganizationUserDto> {
    const organization =
      await this.organizationRepository.findOne(organizationId);
    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    if (userId === requestingUserId) {
      throw new ForbiddenException(
        'No puedes eliminarte a ti mismo de la organización',
      );
    }

    const userRole = await this.organizationRepository.getUserRole(
      organizationId,
      userId,
    );
    if (!userRole) {
      throw new ResourceNotFoundException(
        'OrganizationUser',
        `${organizationId}:${userId}`,
      );
    }

    if (userRole.name === 'dueño') {
      const ownersCount =
        await this.organizationRepository.countOwners(organizationId);
      if (ownersCount <= 1) {
        throw new StateConflictException('dueño', 'remove', {
          reason: 'last_owner',
        });
      }
    }

    return this.organizationRepository.removeUserFromOrganization(
      organizationId,
      userId,
    );
  }

  async uploadTextFile(
    organizationId: string,
    uploadContext: UploadContextDto,
  ): Promise<string> {
    const organization =
      await this.organizationRepository.findOne(organizationId);
    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    const scope = {
      orgId: organizationId,
    };

    return this.textStorageService.uploadText(
      uploadContext.content,
      uploadContext.filename,
      scope,
    );
  }
}
