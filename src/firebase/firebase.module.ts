import { Module } from '@nestjs/common';
import { FirebaseDataService } from './firebase-data.service';

@Module({
  providers: [FirebaseDataService],
  exports: [FirebaseDataService],
})
export class FirebaseModule {}
