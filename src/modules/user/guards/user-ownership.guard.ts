import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@common/exceptions/custom-exceptions';
import { RequestWithUser } from '@modules/auth/types/auth.types';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    
    const authenticatedUserId = request.user.id;
    const targetUserId = request.params?.id as string;

    if (!targetUserId) {
      throw new ForbiddenException('User ID not specified in request');
    }

    if (authenticatedUserId !== targetUserId) {
      throw new ForbiddenException('You can only modify your own profile');
    }

    return true;
  }
} 