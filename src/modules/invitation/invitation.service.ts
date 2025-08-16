import {
  ConflictException,
  ResourceNotFoundException,
  BusinessLogicException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
import { RoleService } from '@modules/role/role.service';
import { Injectable } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';

import { MailService } from '../mail/mail.service';

import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationDto } from './dto/invitation.dto';
import { Invitation } from './entities/invitation.entity';
import { InvitationRepository } from './invitation.repository';

@Injectable()
export class InvitationService {
  constructor(
    private invitationRepository: InvitationRepository,
    private roleService: RoleService,
    private mailService: MailService,
  ) {}

  async create(
    createInvitationDto: CreateInvitationDto,
    userId: string,
  ): Promise<InvitationDto> {
    const existingInvitation = await this.invitationRepository.findByEmail(
      createInvitationDto.email,
      createInvitationDto.projectId,
    );
    const alreadyPending =
      existingInvitation &&
      existingInvitation.status === InvitationStatus.PENDING;
    const alreadyAccepted =
      existingInvitation &&
      existingInvitation.status === InvitationStatus.ACCEPTED;
    if (alreadyPending || alreadyAccepted) {
      throw new ConflictException(
        'An invitation for this email already exists in this project, or the user has already accepted it.',
      );
    }

    // Validate project exists
    const project = await this.invitationRepository.findProjectById(
      createInvitationDto.projectId,
    );

    if (!project) {
      throw new ResourceNotFoundException(
        'Project',
        createInvitationDto.projectId,
      );
    }

    // Validate inviter exists
    const inviter = await this.invitationRepository.findUserById(userId);

    if (!inviter) {
      throw new ResourceNotFoundException('User', userId);
    }

    let roleId: string | undefined;
    if (createInvitationDto.role) {
      const role = await this.roleService.findByName(createInvitationDto.role);
      if (!role) {
        throw new ResourceNotFoundException('Role', createInvitationDto.role);
      }
      roleId = role.id;
    } else {
      // Default role is 'member'
      const defaultRole = await this.roleService.findOrCreate('member');
      roleId = defaultRole.id;
    }

    const invitation = await this.invitationRepository.create(
      createInvitationDto.email,
      createInvitationDto.projectId,
      userId,
      roleId,
    );

    await this.mailService.sendInvitationEmail({
      to: createInvitationDto.email,
      inviteeName: createInvitationDto.email,
      invitedByName: inviter.username,
      projectName: project.name,
      token: invitation.token,
    });

    return this.mapToInvitationDto(invitation);
  }

  async findAllPaginated(
    page: number,
    limit: number,
    projectId?: string,
    status?: InvitationStatus,
  ) {
    const skip = (page - 1) * limit;
    const [invitations, total] =
      await this.invitationRepository.findAllPaginated(
        skip,
        limit,
        projectId,
        status,
      );

    return {
      data: await Promise.all(
        invitations.map((inv) => this.mapToInvitationDto(inv)),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProject(projectId: string, page: number, limit: number) {
    return await this.findAllPaginated(page, limit, projectId);
  }

  async findOne(id: string): Promise<InvitationDto> {
    const invitation = await this.invitationRepository.findById(id);

    if (!invitation) {
      throw new ResourceNotFoundException('Invitation', id);
    }

    return this.mapToInvitationDto(invitation);
  }

  async remove(id: string): Promise<void> {
    const invitation = await this.findOne(id);
    await this.invitationRepository.delete(invitation.id);
  }

  async accept(id: string, userId: string): Promise<InvitationDto> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new StateConflictException(invitation.status, 'accept invitation', {
        validStates: ['PENDING'],
      });
    }

    const invitationFromDb = await this.invitationRepository.findById(id);
    if (!invitationFromDb) {
      throw new ResourceNotFoundException('Invitation', id);
    }

    let roleId: string;
    if (invitationFromDb.roleId) {
      roleId = invitationFromDb.roleId;
    } else {
      const memberRole = await this.roleService.findOrCreate('member');
      roleId = memberRole.id;
    }

    const updatedInvitation =
      await this.invitationRepository.acceptInvitationAndAddUser(
        id,
        userId,
        roleId,
      );

    if (!updatedInvitation) {
      throw new BusinessLogicException('Failed to update invitation', {
        invitationId: id,
        operation: 'accept',
      });
    }

    return await this.mapToInvitationDto(updatedInvitation);
  }

  async reject(id: string): Promise<InvitationDto> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new StateConflictException(invitation.status, 'reject invitation', {
        validStates: ['PENDING'],
      });
    }

    const updatedInvitation = await this.invitationRepository.update(
      id,
      InvitationStatus.REJECTED,
    );

    if (!updatedInvitation) {
      throw new BusinessLogicException('Failed to update invitation', {
        invitationId: id,
        operation: 'reject',
      });
    }

    return await this.mapToInvitationDto(updatedInvitation);
  }

  private async mapToInvitationDto(
    invitation: Invitation,
  ): Promise<InvitationDto> {
    let roleName: string | undefined;

    if (invitation.roleId) {
      const role = await this.roleService.findById(invitation.roleId);
      roleName = role?.name;
    }

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      projectId: invitation.projectId,
      role: roleName,
    };
  }
}
