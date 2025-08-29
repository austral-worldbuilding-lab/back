import {
  ConflictException,
  ResourceNotFoundException,
  BusinessLogicException,
  StateConflictException,
} from '@common/exceptions/custom-exceptions';
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
  ) {}

  async create(
    dto: CreateOrganizationInvitationDto,
    userId: string,
  ): Promise<OrganizationInvitationDto> {
    // ¿Existe invitación previa para este email en la misma organización?
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

    // Validar organización
    const organization = await this.invitationRepository.findOrganizationById(
      dto.organizationId,
    );
    if (!organization) {
      throw new ResourceNotFoundException('Organization', dto.organizationId);
    }

    // Validar invitador
    const inviter = await this.invitationRepository.findUserById(userId);
    if (!inviter) {
      throw new ResourceNotFoundException('User', userId);
    }

    // Resolver rol (por nombre, default member)
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
      dto.expiresAt, // opcional ISO; el repo setea default (+7 días) si viene vacío
    );

    // Reusar template de email de proyecto: pasa nombre de la organización
    await this.mailService.sendInvitationEmail({
      to: dto.email,
      inviteeName: dto.email,
      invitedByName: inviter.username,
      projectName: organization.name, // <- mismo campo que usás en el template
      token: invitation.token,
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
    const inv = await this.findOne(id); // asegura 404 coherente
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

    // Resolver rol final
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

    if (!updated) {
      throw new BusinessLogicException('Failed to update invitation', {
        invitationId: id,
        operation: 'accept',
      });
    }

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

  // ---------------------
  // Mapping helpers
  // ---------------------
  private mapToDto(
    invitation: OrganizationInvitation,
  ): OrganizationInvitationDto {
    // Si querés exponer nombre de rol (como en ProjectInvitation),
    // podés buscarlo acá y añadir un campo `role` a tu DTO.
    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
      invitedById: invitation.invitedById,
      roleId: invitation.roleId ?? null,
    };
  }

  private mapToDtoSync(
    invitation: OrganizationInvitation,
    _roleMap: Map<string, string>,
  ): OrganizationInvitationDto {
    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
      invitedById: invitation.invitedById,
      roleId: invitation.roleId ?? null,
    };
  }
}
