import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfig {
  private static instance: FirebaseConfig;
  private firebaseApp!: admin.app.App;

  private constructor() {
    this.initializeFirebase();
  }

  public static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }

  private initializeFirebase() {
    if (!this.firebaseApp) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
  }

  public getFirebaseApp(): admin.app.App {
    return this.firebaseApp;
  }

  public getAuth(): admin.auth.Auth {
    return this.firebaseApp.auth();
  }
}
