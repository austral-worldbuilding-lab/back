import { randomUUID } from 'crypto';

import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  InvitationStatus,
  Organization,
  User,
  OrganizationInvitation,
} from '@prisma/client';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class OrganizationInvitationRepository {
  constructor(private prisma: PrismaService) {}

  async findOrganizationById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(
    email: string,
    organizationId: string,
    invitedById: string,
    roleId?: string,
    expiresAt?: string,
  ): Promise<OrganizationInvitation> {
    const token = randomUUID();

    // Si no se pasa fecha de expiración, se setea a +7 días
    const expiration = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + SEVEN_DAYS_IN_SECONDS * 1000);

    return this.prisma.organizationInvitation.create({
      data: {
        email,
        organizationId,
        invitedById,
        token,
        expiresAt: expiration,
        ...(roleId && { roleId }),
      },
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
    organizationId?: string,
    status?: InvitationStatus,
  ): Promise<[OrganizationInvitation[], number]> {
    const where = {
      ...(organizationId && { organizationId }),
      ...(status && { status }),
    };

    const [invitations, total] = await this.prisma.$transaction([
      this.prisma.organizationInvitation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organizationInvitation.count({ where }),
    ]);

    return [invitations, total];
  }

  async findRolesByIds(
    roleIds: string[],
  ): Promise<Array<{ id: string; name: string }>> {
    if (roleIds.length === 0) return [];

    return this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });
  }

  async findById(id: string): Promise<OrganizationInvitation | null> {
    return this.prisma.organizationInvitation.findUnique({
      where: { id },
    });
  }

  async findByEmail(
    email: string,
    organizationId: string,
  ): Promise<OrganizationInvitation | null> {
    return this.prisma.organizationInvitation.findFirst({
      where: { email, organizationId },
    });
  }

  async update(
    id: string,
    status: InvitationStatus,
  ): Promise<OrganizationInvitation | null> {
    return this.prisma.organizationInvitation.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<OrganizationInvitation> {
    return this.prisma.organizationInvitation.delete({
      where: { id },
    });
  }

  async acceptInvitationAndAddUser(
    invitationId: string,
    userId: string,
    roleId: string,
  ): Promise<OrganizationInvitation> {
    return this.prisma.$transaction(async (tx) => {
      // Update invitation status
      const invitation = await tx.organizationInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.ACCEPTED },
      });

      // Add user to organization
      await tx.userOrganizationRole.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          roleId,
        },
      });

      return invitation;
    });
  }

  async createWithToken(
    organizationId: string,
    invitedById: string,
    roleId: string,
    inviteToken: string,
    expiresAt: Date,
  ): Promise<OrganizationInvitation> {
    const token = randomUUID();

    return this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        invitedById,
        roleId,
        token,
        inviteToken,
        expiresAt,
        status: InvitationStatus.PENDING,
      },
    });
  }

  async findByInviteToken(
    inviteToken: string,
  ): Promise<OrganizationInvitation | null> {
    return this.prisma.organizationInvitation.findFirst({
      where: {
        inviteToken,
        // Note: No status filter here to allow multi-user invite links
      },
    });
  }

  async isUserOrganizationMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const membership = await this.prisma.userOrganizationRole.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    return !!membership;
  }

  async addUserToOrganization(
    userId: string,
    organizationId: string,
    roleId: string,
  ): Promise<void> {
    await this.prisma.userOrganizationRole.create({
      data: {
        userId,
        organizationId,
        roleId,
      },
    });
  }

  async autoAssignToOrganizationProjects(
    userId: string,
    organizationId: string,
    roleId: string,
  ): Promise<void> {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      select: { id: true },
    });

    // Get the organization role level
    const orgRole = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { level: true },
    });

    if (!orgRole) {
      throw new Error(`Role with id ${roleId} not found`);
    }

    for (const project of projects) {
      // Check if user already has a role in this project
      const existingRole = await this.prisma.userProjectRole.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId: project.id,
          },
        },
        include: {
          role: {
            select: { level: true },
          },
        },
      });

      if (!existingRole) {
        // User doesn't have a role in this project, add them with org role
        await this.prisma.userProjectRole.create({
          data: {
            userId,
            projectId: project.id,
            roleId,
          },
        });
      } else {
        // User has a role, check if org role is higher and update if needed
        const shouldElevate = this.shouldElevateRole(
          existingRole.role.level,
          orgRole.level,
        );

        if (shouldElevate) {
          await this.prisma.userProjectRole.update({
            where: {
              userId_projectId: {
                userId,
                projectId: project.id,
              },
            },
            data: {
              roleId,
            },
          });
        }
      }
    }
  }

  private shouldElevateRole(currentLevel: number, newLevel: number): boolean {
    // Lower number = higher privilege
    // Return true if new role has higher privilege (lower number)
    return newLevel < currentLevel;
  }
}
