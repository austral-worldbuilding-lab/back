import { UnauthorizedException } from '@common/exceptions/custom-exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { AuthService } from '../auth.service';
import { RequestWithUser } from '../types/auth.types';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    request.user = await this.authService.validateUser(token);
    if (request.user) {
      this.cls.set('userId', request.user.id);
    }
    return true;
  }
}
