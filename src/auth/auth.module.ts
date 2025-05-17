import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase/firebase.service';
import { FirebaseAuthGuard } from './firebase/firebase.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [FirebaseService, FirebaseAuthGuard],
  exports: [FirebaseService],
})
export class AuthModule {}
