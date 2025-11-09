import { randomUUID } from 'crypto';

import {
  ResourceNotFoundException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
import { PaginatedResponse } from '@common/types/responses';
import { CreateFileDto } from '@modules/files/dto/create-file.dto';
import { UploadContextDto } from '@modules/files/dto/upload-context.dto';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ProjectDto } from '@modules/project/dto/project.dto';
import { ProjectRepository } from '@modules/project/project.repository';
import { RoleService } from '@modules/role/role.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  ConfirmOrganizationImageDto,
  OrganizationImageType,
} from './dto/confirm-organization-image.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationUserRoleResponseDto } from './dto/organization-user-role-response.dto';
import { OrganizationUserDto } from './dto/organization-user.dto';
import { OrganizationWithPresignedUrlDto } from './dto/organization-with-presigned-url.dto';
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
    private readonly storageService: AzureBlobStorageService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    userId: string,
  ): Promise<OrganizationWithPresignedUrlDto> {
    const ownerRole = await this.roleService.findOrCreate('dueño');

    const org = await this.organizationRepository.create(
      dto,
      userId,
      ownerRole.id,
    );

    return this.addPresignedUrlsToOrganization(org);
  }

  async createDefaultOrganization(userId: string): Promise<OrganizationDto> {
    const ownerRole = await this.roleService.findOrCreate('dueño');

    return this.organizationRepository.create(
      { name: 'Mi Espacio de Trabajo' },
      userId,
      ownerRole.id,
    );
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
  ): Promise<OrganizationWithPresignedUrlDto> {
    const org = await this.organizationRepository.findOne(id);
    if (!org) {
      throw new ResourceNotFoundException('Organization', id);
    }

    const updatedOrg = await this.organizationRepository.update(id, dto);

    return this.addPresignedUrlsToOrganization(updatedOrg);
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

  async findOrganizationIdByProjectId(projectId: string) {
    return this.organizationRepository.findOrganizationIdByProjectId(projectId);
  }

  private async generatePresignedUrl(
    organizationId: string,
    fileName: string,
  ): Promise<string> {
    const fileMetadata: CreateFileDto = {
      file_name: fileName,
      file_type: 'image/*',
    };

    const presignedUrls = await this.storageService.uploadFiles(
      [fileMetadata],
      { orgId: organizationId },
      'images',
    );

    if (!presignedUrls[0]?.url) {
      throw new ResourceNotFoundException('PresignedUrl', fileName);
    }

    return presignedUrls[0].url;
  }

  private async addPresignedUrlsToOrganization(
    org: OrganizationDto,
  ): Promise<OrganizationWithPresignedUrlDto> {
    // Generate presigned URLs for profile picture and banner upload
    const profileImageId = randomUUID();
    const profilePresignedUrl = await this.generatePresignedUrl(
      org.id,
      profileImageId,
    );

    const bannerImageId = randomUUID();
    const bannerPresignedUrl = await this.generatePresignedUrl(
      org.id,
      bannerImageId,
    );

    return {
      ...org,
      profilePicture: {
        imageId: profileImageId,
        presignedUrl: profilePresignedUrl,
      },
      bannerPicture: {
        imageId: bannerImageId,
        presignedUrl: bannerPresignedUrl,
      },
    };
  }

  async confirmImageUpload(
    organizationId: string,
    dto: ConfirmOrganizationImageDto,
  ): Promise<OrganizationDto> {
    const org = await this.organizationRepository.findOne(organizationId);
    if (!org) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    const blobExists = await this.storageService.blobExists(
      { orgId: organizationId },
      dto.imageId,
      'images',
    );

    if (!blobExists) {
      throw new ResourceNotFoundException('Image', dto.imageId);
    }

    const publicUrl = this.storageService.buildPublicUrl(
      { orgId: organizationId },
      dto.imageId,
      'images',
    );

    if (dto.imageType === OrganizationImageType.PROFILE_PICTURE) {
      return this.organizationRepository.updateImageUrl(
        organizationId,
        publicUrl,
      );
    } else {
      return this.organizationRepository.updateBannerUrl(
        organizationId,
        publicUrl,
      );
    }
  }
}
