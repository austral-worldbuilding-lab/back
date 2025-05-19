import { Injectable } from '@nestjs/common';
import { Invitation } from './entities/invitation.entity';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationStatus, Project, User, Role } from '@prisma/client';

@Injectable()
export class InvitationRepository {
  constructor(private prisma: PrismaService) {}

  async findProjectById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
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
  ): Promise<Invitation> {
    return this.prisma.invitation.create({
      data: {
        email,
        projectId,
        invitedById,
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

  async findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async createRole(name: string): Promise<Role> {
    return this.prisma.role.create({
      data: { name },
    });
  }

  async findOrCreateRole(name: string): Promise<Role> {
    const role = await this.findRoleByName(name);
    if (role) {
      return role;
    }
    return this.createRole(name);
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
}
