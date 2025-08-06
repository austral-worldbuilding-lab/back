import { FirebaseConfig } from '@config/firebase.config';
import { Injectable } from '@nestjs/common';
import type {
  DocumentData,
  UpdateData,
  WithFieldValue,
} from 'firebase-admin/firestore';

@Injectable()
export class FirebaseDataService {
  private firebaseConfig: FirebaseConfig;

  constructor() {
    this.firebaseConfig = FirebaseConfig.getInstance();
  }

  async createDocument(
    collectionPath: string,
    data: WithFieldValue<DocumentData>,
    documentId?: string,
  ): Promise<void> {
    const db = this.firebaseConfig.getDB();
    const docRef = documentId
      ? db.collection(collectionPath).doc(documentId)
      : db.collection(collectionPath).doc();

    await docRef.set(data);
  }

  async getDocument(
    collectionPath: string,
    documentId: string,
  ): Promise<DocumentData | undefined> {
    const db = this.firebaseConfig.getDB();
    const docRef = db.collection(collectionPath).doc(documentId);
    const doc = await docRef.get();

    return doc.exists ? doc.data() : undefined;
  }

  async updateDocument(
    collectionPath: string,
    data: UpdateData<DocumentData>,
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
