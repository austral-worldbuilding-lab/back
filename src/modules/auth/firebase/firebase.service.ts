import { ExternalServiceException } from '@common/exceptions/custom-exceptions';
import { FirebaseConfig } from '@config/firebase.config';
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private firebaseConfig: FirebaseConfig;

  constructor() {
    this.firebaseConfig = FirebaseConfig.getInstance();
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.firebaseConfig.getAuth().verifyIdToken(token);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      throw new ExternalServiceException(
        'Firebase Auth',
        'Token verification failed',
        {
          errorCode: err.code,
          originalError: err.message,
        },
      );
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseConfig.getAuth().getUser(uid);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      throw new ExternalServiceException(
        'Firebase Auth',
        'User retrieval failed',
        {
          uid,
          errorCode: err.code,
          originalError: err.message,
        },
      );
    }
  }
}
