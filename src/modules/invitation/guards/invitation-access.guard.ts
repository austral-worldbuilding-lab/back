import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { Invitation } from '@modules/invitation/entities/invitation.entity';
import { User } from '@modules/user/entities/user.entity';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { InvitationRepository } from '../invitation.repository';

export const REQUIRED_INVITATION_ACCESS_KEY = 'requiredInvitationAccess';
export const RequireInvitationAccess = (
  ...accessTypes: ('sender' | 'recipient')[]
) => SetMetadata(REQUIRED_INVITATION_ACCESS_KEY, accessTypes);

@Injectable()
export class InvitationAccessGuard implements CanActivate {
  constructor(
    private invitationRepository: InvitationRepository,
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
      throw new Error('No invitation ID found in request');
    }

    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new ResourceNotFoundException('Invitation', invitationId);
    }

    const requiredAccess = this.reflector.get<('sender' | 'recipient')[]>(
      REQUIRED_INVITATION_ACCESS_KEY,
      context.getHandler(),
    );

    if (!requiredAccess || requiredAccess.length === 0) {
      const isSender = invitation.invitedById === user.id;
      const isRecipient = invitation.email === user.email;

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
    invitation: Invitation,
    requiredAccess: ('sender' | 'recipient')[],
  ): boolean {
    for (const access of requiredAccess) {
      switch (access) {
        case 'sender':
          if (invitation.invitedById === user.id) return true;
          break;
        case 'recipient':
          if (invitation.email === user.email) return true;
          break;
      }
    }
    return false;
  }
}
