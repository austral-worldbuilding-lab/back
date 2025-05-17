import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as PassportStrategyType } from 'passport';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(
  PassportStrategyType,
  'firebase',
) {
  constructor(private readonly firebaseService: FirebaseService) {
    super();
  }

  async validate(token: string): Promise<any> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      const user = await this.firebaseService.getUser(decodedToken.uid);

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
    } catch (_error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
