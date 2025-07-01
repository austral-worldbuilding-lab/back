import { FirebaseConfig } from '@config/firebase.config';
import { Injectable } from '@nestjs/common';

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

  async getDocument(collectionPath: string, documentId: string): Promise<any> {
    const db = this.firebaseConfig.getDB();
    const docRef = db.collection(collectionPath).doc(documentId);
    const doc = await docRef.get();

    return doc.exists ? doc.data() : null;
  }

  async updateDocument(
    collectionPath: string,
    data: any,
    documentId: string,
  ): Promise<void> {
    const db = this.firebaseConfig.getDB();
    const docRef = db.collection(collectionPath).doc(documentId);

    await docRef.update(data);
  }

  async deleteDocument(
    collectionPath: string,
    documentId: string,
  ): Promise<void> {
    const db = this.firebaseConfig.getDB();
    const docRef = db.collection(collectionPath).doc(documentId);

    await docRef.delete();
  }
}
