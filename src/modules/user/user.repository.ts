import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ProjSolLinkRole } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    return this.prisma.user.create({
      data: {
        id: createUserDto.firebaseUid,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        is_active: createUserDto.is_active,
      },
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
  ): Promise<[UserDto[], number]> {
    const where = { is_active: true };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          is_active: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return [users, total];
  }

  async findOne(id: string): Promise<UserDto | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        is_active: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        is_active: true,
      },
    });
  }

  async deactivateUser(targetUserId: string): Promise<UserDto> {
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { is_active: false },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        is_active: true,
      },
    });
  }

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const userOrganizationIds = await this.prisma.userOrganizationRole
      .findMany({
        where: { userId },
        select: { organizationId: true },
      })
      .then((roles) => roles.map((r) => r.organizationId));

    const userProjectIds = await this.prisma.userProjectRole
      .findMany({
        where: {
          userId,
          project: {
            isActive: true,
          },
        },
        select: { projectId: true },
      })
      .then((roles) => roles.map((r) => r.projectId));

    const [organizationsCount, projectsCount, mandalasCount, solutionsCount] =
      await Promise.all([
        // Count organizations
        userOrganizationIds.length > 0
          ? this.prisma.organization.count({
              where: {
                id: { in: userOrganizationIds },
                isActive: true,
              },
            })
          : 0,

        // Count projects
        userProjectIds.length > 0
          ? this.prisma.project.count({
              where: {
                id: { in: userProjectIds },
                isActive: true,
              },
            })
          : 0,

        // Count mandalas
        userProjectIds.length > 0
          ? this.prisma.mandala.count({
              where: {
                projectId: { in: userProjectIds },
                isActive: true,
              },
            })
          : 0,

        // Count solutions
        userProjectIds.length > 0
          ? this.prisma.projSolLink.count({
              where: {
                projectId: { in: userProjectIds },
                role: ProjSolLinkRole.GENERATED,
                project: {
                  isActive: true,
                },
              },
            })
          : 0,
      ]);

    return {
      organizationsCount,
      projectsCount,
      mandalasCount,
      solutionsCount,
    };
  }
}
