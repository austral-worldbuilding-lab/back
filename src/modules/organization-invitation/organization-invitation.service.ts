import { randomBytes } from 'node:crypto';

import {
  ConflictException,
  ResourceNotFoundException,
  BusinessLogicException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { PaginatedResponse } from '@common/types/responses';
import { RoleService } from '@modules/role/role.service';
import { Injectable } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';

import { MailService } from '../mail/mail.service';

import { CreateOrganizationInvitationDto } from './dto/create-organization-invitation.dto';
import { OrganizationInvitationDto } from './dto/organization-invitation.dto';
import { OrganizationInvitation } from './entities/organization-invitation.entity';
import { OrganizationInvitationRepository } from './organization-invitation.repository';

@Injectable()
export class OrganizationInvitationService {
  constructor(
    private invitationRepository: OrganizationInvitationRepository,
    private roleService: RoleService,
    private mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(OrganizationInvitationService.name);
  }

  async create(
    dto: CreateOrganizationInvitationDto,
    userId: string,
  ): Promise<OrganizationInvitationDto> {
    const existing = await this.invitationRepository.findByEmail(
      dto.email,
      dto.organizationId,
    );
    const alreadyPending =
      existing && existing.status === InvitationStatus.PENDING;
    const alreadyAccepted =
      existing && existing.status === InvitationStatus.ACCEPTED;

    if (alreadyPending || alreadyAccepted) {
      throw new ConflictException(
        'An invitation for this email already exists in this organization, or the user has already accepted it.',
      );
    }

    const organization = await this.invitationRepository.findOrganizationById(
      dto.organizationId,
    );
    if (!organization) {
      throw new ResourceNotFoundException('Organization', dto.organizationId);
    }

    const inviter = await this.invitationRepository.findUserById(userId);
    if (!inviter) {
      throw new ResourceNotFoundException('User', userId);
    }

    let roleId: string;
    if (dto.role) {
      const role = await this.roleService.findByName(dto.role);
      if (!role) throw new ResourceNotFoundException('Role', dto.role);
      roleId = role.id;
    } else {
      const defaultRole = await this.roleService.findOrCreate('member');
      roleId = defaultRole.id;
    }

    const invitation = await this.invitationRepository.create(
      dto.email,
      dto.organizationId,
      userId,
      roleId,
      dto.expiresAt,
    );

    await this.mailService.sendInvitationEmail({
      to: dto.email,
      inviteeName: dto.email,
      invitedByName: inviter.username,
      projectName: organization.name,
      token: invitation.token,
      organizationId: organization.id,
    });

    return this.mapToDto(invitation);
  }

  async findAllPaginated(
    page: number,
    limit: number,
    organizationId?: string,
    status?: InvitationStatus,
  ): Promise<PaginatedResponse<OrganizationInvitationDto>> {
    const skip = (page - 1) * limit;

    const [invitations, total] =
      await this.invitationRepository.findAllPaginated(
        skip,
        limit,
        organizationId,
        status,
      );

    const roleIds = invitations
      .map((inv) => inv.roleId)
      .filter((id): id is string => !!id);

    const roles = await this.invitationRepository.findRolesByIds(roleIds);
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    const data = invitations.map((inv) => this.mapToDtoSync(inv, roleMap));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByOrganization(
    organizationId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<OrganizationInvitationDto>> {
    return this.findAllPaginated(page, limit, organizationId);
  }

  async findOne(id: string): Promise<OrganizationInvitationDto> {
    const invitation = await this.invitationRepository.findById(id);
    if (!invitation) {
      throw new ResourceNotFoundException('OrganizationInvitation', id);
    }
    return this.mapToDto(invitation);
  }

  async remove(id: string): Promise<void> {
    const inv = await this.findOne(id);
    await this.invitationRepository.delete(inv.id);
  }

  async accept(id: string, userId: string): Promise<OrganizationInvitationDto> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new StateConflictException(invitation.status, 'accept invitation', {
        validStates: ['PENDING'],
      });
    }

    const invitationFromDb = await this.invitationRepository.findById(id);
    if (!invitationFromDb) {
      throw new ResourceNotFoundException('OrganizationInvitation', id);
    }

    let roleId: string;
    if (invitationFromDb.roleId) {
      roleId = invitationFromDb.roleId;
    } else {
      const memberRole = await this.roleService.findOrCreate('member');
      roleId = memberRole.id;
    }

    const updated = await this.invitationRepository.acceptInvitationAndAddUser(
      id,
      userId,
      roleId,
    );

    // Auto-assign user to all projects in the organization
    await this.invitationRepository.autoAssignToOrganizationProjects(
      userId,
      invitationFromDb.organizationId,
      roleId,
    );

    return this.mapToDto(updated);
  }

  async reject(id: string): Promise<OrganizationInvitationDto> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new StateConflictException(invitation.status, 'reject invitation', {
        validStates: ['PENDING'],
      });
    }

    const updated = await this.invitationRepository.update(
      id,
      InvitationStatus.REJECTED,
    );

    if (!updated) {
      throw new BusinessLogicException('Failed to update invitation', {
        invitationId: id,
        operation: 'reject',
      });
    }

    return this.mapToDto(updated);
  }

  private async mapToDto(
    invitation: OrganizationInvitation,
  ): Promise<OrganizationInvitationDto> {
    let roleName: string | undefined;

    if (invitation.role) {
      roleName = invitation.role.name;
    } else if (invitation.roleId) {
      const role = await this.roleService.findById(invitation.roleId);
      roleName = role?.name;
    }

    return {
      id: invitation.id,
      email: invitation.email || undefined,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
      role: roleName,
      inviteToken: invitation.inviteToken || undefined,
    };
  }

  private mapToDtoSync(
    invitation: OrganizationInvitation,
    _roleMap: Map<string, string>,
  ): OrganizationInvitationDto {
    let roleName: string | undefined;

    if (invitation.role) {
      roleName = invitation.role.name;
    } else if (invitation.roleId) {
      roleName = _roleMap.get(invitation.roleId);
    }

    return {
      id: invitation.id,
      email: invitation.email || undefined,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
      role: roleName,
      inviteToken: invitation.inviteToken || undefined,
    };
  }

  async createInviteLink(
    organizationId: string,
    role: string,
    senderId: string,
    expiresAt?: Date,
    email?: string,
    sendEmail?: boolean,
  ): Promise<OrganizationInvitationDto & { inviteToken: string }> {
    const organization =
      await this.invitationRepository.findOrganizationById(organizationId);
    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }
    const sender = await this.invitationRepository.findUserById(senderId);
    if (!sender) {
      throw new ResourceNotFoundException('User', senderId);
    }
    const roleEntity = await this.roleService.findByName(role);
    if (!roleEntity) {
      throw new ResourceNotFoundException('Role', role);
    }
    const roleId = roleEntity.id;

    const inviteToken = this.generateInviteToken();
    const defaultExpiresAt =
      expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.invitationRepository.createWithToken(
      organizationId,
      senderId,
      roleId,
      inviteToken,
      defaultExpiresAt,
    );

    this.logger.log('Created organization invite link', {
      invitationId: invitation.id,
      token: inviteToken,
      organizationId,
      role,
      senderId,
      expiresAt: defaultExpiresAt.toISOString(),
    });

    if (email && sendEmail) {
      await this.mailService.sendInvitationEmail({
        to: email,
        inviteeName: email,
        invitedByName: sender.username,
        projectName: organization.name,
        token: inviteToken,
        organizationId: organizationId,
      });
    }

    const dto = await this.mapToDto(invitation);
    return { ...dto, inviteToken };
  }

  async acceptByToken(
    token: string,
    userId: string,
  ): Promise<{ organizationId: string }> {
    this.logger.log('Attempting to accept organization invitation by token', {
      token,
      userId,
    });

    const invitation = await this.invitationRepository.findByInviteToken(token);

    if (!invitation) {
      this.logger.warn('Organization invitation not found', {
        token,
        userId,
      });
      throw new ResourceNotFoundException('Invitation', token);
    }

    this.logger.log('Found organization invitation', {
      invitationId: invitation.id,
      status: invitation.status,
      organizationId: invitation.organizationId,
      roleId: invitation.roleId,
    });
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      throw new BusinessLogicException('Invitation has expired', {
        token,
        expiresAt: invitation.expiresAt,
      });
    }
    const isAlreadyMember =
      await this.invitationRepository.isUserOrganizationMember(
        userId,
        invitation.organizationId,
      );

    if (isAlreadyMember) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    let roleId: string;
    if (invitation.roleId) {
      roleId = invitation.roleId;
    } else {
      const memberRole = await this.roleService.findOrCreate('member');
      roleId = memberRole.id;
    }

    await this.invitationRepository.acceptInvitationAndAddUser(
      invitation.id,
      userId,
      roleId,
    );

    await this.invitationRepository.autoAssignToOrganizationProjects(
      userId,
      invitation.organizationId,
      roleId,
    );

    this.logger.log('Successfully accepted organization invitation', {
      invitationId: invitation.id,
      userId,
      organizationId: invitation.organizationId,
      roleId,
    });

    return {
      organizationId: invitation.organizationId,
    };
  }

  private generateInviteToken(): string {
    return randomBytes(32).toString('hex');
  }
}
