import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { User } from '@modules/user/entities/user.entity';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OrganizationInvitation } from '../entities/organization-invitation.entity';
import { OrganizationInvitationRepository } from '../organization-invitation.repository';

export const REQUIRED_ORG_INVITATION_ACCESS_KEY = 'requiredOrgInvitationAccess';
export const RequireOrgInvitationAccess = (
  ...accessTypes: ('sender' | 'recipient')[]
) => SetMetadata(REQUIRED_ORG_INVITATION_ACCESS_KEY, accessTypes);

@Injectable()
export class OrganizationInvitationAccessGuard implements CanActivate {
  constructor(
    private invitationRepository: OrganizationInvitationRepository,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const invitationId = request.params?.id;
    if (!invitationId) {
      throw new Error('No organization invitation ID found in request');
    }

    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new ResourceNotFoundException(
        'OrganizationInvitation',
        invitationId,
      );
    }

    const requiredAccess = this.reflector.get<('sender' | 'recipient')[]>(
      REQUIRED_ORG_INVITATION_ACCESS_KEY,
      context.getHandler(),
    );

    // Si no se especifica un tipo de acceso requerido, permitimos sender o recipient por defecto
    if (!requiredAccess || requiredAccess.length === 0) {
      const isSender = invitation.invitedById === user.id;
      const isRecipient =
        !!user.email &&
        invitation.email.toLowerCase() === user.email.toLowerCase();

      if (!isSender && !isRecipient) {
        throw new ForbiddenException(
          'Solo puedes acceder a invitaciones que enviaste o recibiste',
        );
      }
      return true;
    }

    const hasAccess = this.checkAccess(user, invitation, requiredAccess);

    if (!hasAccess) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    return true;
  }

  private checkAccess(
    user: User,
    invitation: OrganizationInvitation,
    requiredAccess: ('sender' | 'recipient')[],
  ): boolean {
    for (const access of requiredAccess) {
      switch (access) {
        case 'sender':
          if (invitation.invitedById === user.id) return true;
          break;
        case 'recipient':
          if (
            !!user.email &&
            invitation.email.toLowerCase() === user.email.toLowerCase()
          )
            return true;
          break;
      }
    }
    return false;
  }
}
