import { randomUUID } from 'crypto';

import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { InvitationStatus, Project, User } from '@prisma/client';

import { Invitation } from './entities/invitation.entity';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

type PrismaTransaction = Omit<
  PrismaService,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$use'
  | '$extends'
  | 'onModuleInit'
  | 'onModuleDestroy'
>;

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
      // 1. Actualizar estado de invitación
      const invitation = await tx.invitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.ACCEPTED },
      });

      // 2. Agregar al proyecto invitado
      await tx.userProjectRole.create({
        data: {
          userId,
          projectId: invitation.projectId,
          roleId,
        },
      });

      // 3. Obtener la cadena de proyectos padres
      const parentProjects = await this.getProjectAncestors(
        tx,
        invitation.projectId,
      );

      // 4. Agregar al usuario a todos los proyectos padres
      // Usar el rol "member" para los padres, o podrías usar el mismo roleId
      const defaultRole = await tx.role.findFirst({
        where: { name: 'worldbuilder' },
      });

      for (const parentProject of parentProjects) {
        // Verificar si ya es miembro
        const existingRole = await tx.userProjectRole.findFirst({
          where: {
            userId,
            projectId: parentProject.id,
          },
        });

        if (!existingRole) {
          await tx.userProjectRole.create({
            data: {
              userId,
              projectId: parentProject.id,
              roleId: defaultRole?.id || roleId,
            },
          });
        }
      }

      return invitation;
    });
  }

  private async getProjectAncestors(
    tx: PrismaTransaction,
    projectId: string,
  ): Promise<{ id: string; parentProjectId: string | null }[]> {
    const ancestors: { id: string; parentProjectId: string | null }[] = [];
    let currentProjectId: string | null = projectId;

    while (currentProjectId) {
      const project: { id: string; parentProjectId: string | null } | null =
        await tx.project.findUnique({
          where: { id: currentProjectId },
          select: {
            id: true,
            parentProjectId: true,
          },
        });

      if (!project || !project.parentProjectId) break;

      ancestors.push({
        id: project.parentProjectId,
        parentProjectId: null, // No necesitamos el dato
      });

      currentProjectId = project.parentProjectId;
    }

    return ancestors;
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
    // Solo para usar cuando es una invitación multiusuario (sin email)
    // porque no cambiamos el estado para que no se "roben" la invitación
    return this.prisma.invitation.findFirst({
      where: {
        inviteToken,
        // Note: No status filter here to allow multi-user invite links
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
}
