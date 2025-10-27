import { Injectable } from '@nestjs/common';

import { FirebaseDataService } from '../firebase/firebase-data.service';

import { Notification } from './types/notification';

@Injectable()
export class NotificationService {
  constructor(private firebaseDataService: FirebaseDataService) {}

  async sendNotification(userId: string, notification: Notification) {
    await this.firebaseDataService.createDocument(
      `users/${userId}/notifications`,
      notification,
    );
  }
}
