import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';

import { NotificationService } from './notification.service';

@Module({
  imports: [FirebaseModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
