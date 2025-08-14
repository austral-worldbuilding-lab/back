import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma, Organization } from '@prisma/client';

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
    const whereClause: Prisma.OrganizationWhereInput = {
      isActive: true,
      userRoles: {
        some: {
          userId,
        },
      },
    };

    const [orgs, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where: whereClause }),
    ]);

    return [orgs.map((o) => this.parseToOrganizationDto(o)), total];
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
}
