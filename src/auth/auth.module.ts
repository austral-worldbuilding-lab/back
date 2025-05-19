import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase/firebase.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule],
  providers: [FirebaseService, AuthService],
  exports: [FirebaseService, AuthService],
})
export class AuthModule {}
