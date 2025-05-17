import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FirebaseService } from './firebase/firebase.service';
import { FirebaseStrategy } from './firebase/firebase.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PassportModule, UserModule],
  providers: [FirebaseService, FirebaseStrategy],
  exports: [FirebaseService],
})
export class AuthModule {}
