import { Injectable } from '@nestjs/common';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationStatus as PrismaInvitationStatus } from '@prisma/client';

@Injectable()
export class InvitationRepository {
  constructor(private prisma: PrismaService) {}

  private mapToEntity(prismaInvitation: any): Invitation {
    const invitation = new Invitation(prismaInvitation.email);
    invitation.id = prismaInvitation.id;
    invitation.status = prismaInvitation.status.toLowerCase() as InvitationStatus;
    invitation.created_at = prismaInvitation.createdAt;
    invitation.updated_at = prismaInvitation.updatedAt;
    return invitation;
  }

  private mapToPrismaStatus(status: InvitationStatus): PrismaInvitationStatus {
    return status.toUpperCase() as PrismaInvitationStatus;
  }

  async create(email: string, projectId: string, invitedById: string): Promise<Invitation> {
    // Validar que el proyecto existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
  
    if (!project) {
      throw new Error(`Project with ID ${projectId} does not exist.`);
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
    });
  
    if (!inviter) {
      throw new Error(`User with ID ${invitedById} does not exist.`);
    }
  
    try {
      const prismaInvitation = await this.prisma.invitation.create({
        data: {
          email,
          projectId,
          invitedById,
          token: crypto.randomUUID(),
        },
      });
  
      return this.mapToEntity(prismaInvitation);
    } catch (error) {
      throw error;
    }
  }
  

  async findAll(): Promise<Invitation[]> {
    const prismaInvitations = await this.prisma.invitation.findMany();
    return prismaInvitations.map(inv => this.mapToEntity(inv));
  }

  async findById(id: string): Promise<Invitation | null> {
    const prismaInvitation = await this.prisma.invitation.findUnique({
      where: { id },
    });
    return prismaInvitation ? this.mapToEntity(prismaInvitation) : null;
  }

  async findByEmail(email: string): Promise<Invitation | null> {
    const prismaInvitation = await this.prisma.invitation.findFirst({
      where: { email },
    });
    return prismaInvitation ? this.mapToEntity(prismaInvitation) : null;
  }

  async update(id: string, status: InvitationStatus): Promise<Invitation | null> {
    const prismaInvitation = await this.prisma.invitation.update({
      where: { id },
      data: { status: this.mapToPrismaStatus(status) },
    });
    return this.mapToEntity(prismaInvitation);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.invitation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
} 