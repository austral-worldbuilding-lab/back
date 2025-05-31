import { Injectable } from '@nestjs/common';
import { FirebaseConfig } from '@config/firebase.config';

@Injectable()
export class FirebaseDataService {
  private firebaseConfig: FirebaseConfig;

  constructor() {
    this.firebaseConfig = FirebaseConfig.getInstance();
  }

  async createDocument(
    collectionPath: string,
    data: any,
    documentId?: string,
  ): Promise<void> {
    const db = this.firebaseConfig.getDB();
    const docRef = documentId
      ? db.collection(collectionPath).doc(documentId)
      : db.collection(collectionPath).doc();

    await docRef.set(data);
  }
}
