import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Organization } from '@prisma/client';

import { CreateOrganizationDto } from './dto/create-organization.dto';
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
}
