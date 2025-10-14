import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Organization } from '@prisma/client';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationUserRoleResponseDto } from './dto/organization-user-role-response.dto';
import { OrganizationUserDto } from './dto/organization-user.dto';
import { OrganizationDto } from './dto/organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationRepository {
  constructor(private prisma: PrismaService) {}

  private parseToOrganizationDto(org: Organization): OrganizationDto {
    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
    };
  }

  async create(
    dto: CreateOrganizationDto,
    userId: string,
    roleId: string,
  ): Promise<OrganizationDto> {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
        },
      });

      await tx.userOrganizationRole.create({
        data: {
          userId,
          organizationId: org.id,
          roleId,
        },
      });

      return this.parseToOrganizationDto(org);
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
    userId: string,
  ): Promise<[OrganizationDto[], number]> {
    const orgsWithAccess = await this.prisma.organization.findMany({
      where: {
        isActive: true,
        OR: [
          { userRoles: { some: { userId } } },
          { projects: { some: { userRoles: { some: { userId } } } } },
        ],
      },
      include: {
        userRoles: { where: { userId }, include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const orgDtos = orgsWithAccess.map((org) => ({
      ...this.parseToOrganizationDto(org),
      accessType:
        org.userRoles.length > 0 ? ('full' as const) : ('limited' as const),
    }));

    const total = orgDtos.length;
    const paginated = orgDtos.slice(skip, skip + take);

    return [paginated, total];
  }

  async findOne(id: string): Promise<OrganizationDto | null> {
    const org = await this.prisma.organization.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!org) {
      return null;
    }

    return this.parseToOrganizationDto(org);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDto> {
    const org = await this.prisma.organization.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    return this.parseToOrganizationDto(org);
  }

  async remove(id: string): Promise<OrganizationDto> {
    const org = await this.prisma.organization.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return this.parseToOrganizationDto(org);
  }

  async removeWithCascade(id: string): Promise<OrganizationDto> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Soft delete all mandalas from active projects in the organization
      await tx.mandala.updateMany({
        where: {
          project: {
            organizationId: id,
            isActive: true,
          },
          isActive: true,
        },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      // 2. Soft delete all projects in the organization
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

      // 3. Soft delete the organization itself
      const org = await tx.organization.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      return this.parseToOrganizationDto(org);
    });
  }

  async getOrganizationUsers(
    organizationId: string,
  ): Promise<OrganizationUserDto[]> {
    const userRoles = await this.prisma.userOrganizationRole.findMany({
      where: {
        organizationId,
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

    return userRoles.map((userRole) => ({
      id: userRole.user.id,
      username: userRole.user.username,
      email: userRole.user.email,
      role: userRole.role.name,
      isActive: userRole.user.is_active,
    }));
  }

  async updateUserRole(
    organizationId: string,
    userId: string,
    roleId: string,
  ): Promise<OrganizationUserRoleResponseDto> {
    const existingUserRole = await this.prisma.userOrganizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
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
      throw new ResourceNotFoundException('User', userId, 'en la organización');
    }

    const updatedUserRole = await this.prisma.userOrganizationRole.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
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
      organizationId: updatedUserRole.organizationId,
      role: updatedUserRole.role.name,
      user: updatedUserRole.user,
    };
  }

  async removeUserFromOrganization(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationUserDto> {
    const existingUserRole = await this.prisma.userOrganizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
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
      throw new ResourceNotFoundException('User', userId, 'en la organización');
    }

    await this.prisma.userOrganizationRole.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
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

  async getUserRole(
    organizationId: string,
    userId: string,
  ): Promise<{ id: string; name: string } | null> {
    const organizationUser = await this.prisma.userOrganizationRole.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { role: true },
    });
    return organizationUser?.role
      ? { id: organizationUser.role.id, name: organizationUser.role.name }
      : null;
  }

  async countOwners(organizationId: string): Promise<number> {
    return this.prisma.userOrganizationRole.count({
      where: { organizationId, role: { name: 'owner' } },
    });
  }
}
