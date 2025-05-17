import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UserService } from '../../user/user.service';
import { RequestWithUser } from '../types/auth.types';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
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

    const decodedToken = await this.firebaseService.verifyToken(token);
    const firebaseUser = await this.firebaseService.getUser(decodedToken.uid);
    if (!firebaseUser.email) {
      throw new UnauthorizedException('Firebase user has no email');
    }

    const user = await this.userService.findByEmail(firebaseUser.email);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    request.user = user;
    return true;
  }
}
