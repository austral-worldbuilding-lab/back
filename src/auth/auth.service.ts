import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from './firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(token: string) {
    const decodedToken = await this.firebaseService.verifyToken(token);
    const firebaseUser = await this.firebaseService.getUser(decodedToken.uid);
    
    if (!firebaseUser.email) {
      throw new UnauthorizedException('Firebase user has no email');
    }

    const user = await this.findUserByEmail(firebaseUser.email);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  private async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        email: true,
        is_active: true,
      },
    });
  }
} 