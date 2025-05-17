import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as PassportStrategyType } from 'passport';
import { FirebaseService } from './firebase.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(
  PassportStrategyType,
  'firebase',
) {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async validate(token: string): Promise<any> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      const firebaseUser = await this.firebaseService.getUser(decodedToken.uid);

      if (!firebaseUser.email) {
        throw new UnauthorizedException('Firebase user has no email');
      }

      const user = await this.userService.findByEmail(firebaseUser.email);

      if (!user) {
        throw new UnauthorizedException('User not found in database');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('User account is deactivated');
      }

      return user;
    } catch (_error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
