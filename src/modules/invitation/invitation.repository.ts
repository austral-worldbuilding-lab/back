import { randomUUID } from 'crypto';

import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { InvitationStatus, Project, User } from '@prisma/client';

import { Invitation } from './entities/invitation.entity';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class InvitationRepository {
  constructor(private prisma: PrismaService) {}

  async findProjectById(id: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
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
    projectId: string,
    invitedById: string,
    roleId?: string,
  ): Promise<Invitation> {
    const token = randomUUID();

    // Set expiration date to current date + 7 days
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + SEVEN_DAYS_IN_SECONDS);

    return this.prisma.invitation.create({
      data: {
        email,
        projectId,
        invitedById,
        token,
        expiresAt,
        ...(roleId && { roleId }),
      },
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
    projectId?: string,
    status?: InvitationStatus,
  ): Promise<[Invitation[], number]> {
    const where = {
      ...(projectId && { projectId }),
      ...(status && { status }),
    };

    const [invitations, total] = await this.prisma.$transaction([
      this.prisma.invitation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invitation.count({ where }),
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

  async findById(id: string): Promise<Invitation | null> {
    return this.prisma.invitation.findUnique({
      where: { id },
    });
  }

  async findByEmail(
    email: string,
    projectId: string,
  ): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: { email, projectId },
    });
  }

  async update(
    id: string,
    status: InvitationStatus,
  ): Promise<Invitation | null> {
    return this.prisma.invitation.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Invitation> {
    return this.prisma.invitation.delete({
      where: { id },
    });
  }

  async acceptInvitationAndAddUser(
    invitationId: string,
    userId: string,
    roleId: string,
  ): Promise<Invitation> {
    return this.prisma.$transaction(async (tx) => {
      // Update invitation status
      const invitation = await tx.invitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.ACCEPTED },
      });

      // Add user to project
      await tx.userProjectRole.create({
        data: {
          userId,
          projectId: invitation.projectId,
          roleId,
        },
      });

      return invitation;
    });
  }

  async createWithToken(
    projectId: string,
    invitedById: string,
    roleId: string,
    inviteToken: string,
    expiresAt: Date,
  ): Promise<Invitation> {
    const token = randomUUID();

    return this.prisma.invitation.create({
      data: {
        projectId,
        invitedById,
        roleId,
        token,
        inviteToken,
        expiresAt,
        status: InvitationStatus.PENDING,
      },
    });
  }

  async findByInviteToken(inviteToken: string): Promise<Invitation | null> {
    return this.prisma.invitation.findFirst({
      where: {
        inviteToken,
        status: InvitationStatus.PENDING,
      },
    });
  }

  async isUserProjectMember(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    const membership = await this.prisma.userProjectRole.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    return !!membership;
  }

  async addUserToProject(
    userId: string,
    projectId: string,
    roleId: string,
  ): Promise<void> {
    await this.prisma.userProjectRole.create({
      data: {
        userId,
        projectId,
        roleId,
      },
    });
  }
}
