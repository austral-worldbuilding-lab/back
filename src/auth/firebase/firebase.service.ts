import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseConfig } from '../../config/firebase.config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private firebaseConfig: FirebaseConfig;

  constructor() {
    this.firebaseConfig = FirebaseConfig.getInstance();
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.firebaseConfig.getAuth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseConfig.getAuth().getUser(uid);
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }
} 