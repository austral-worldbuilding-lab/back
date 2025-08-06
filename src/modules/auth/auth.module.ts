import { PrismaModule } from '@modules/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [PrismaModule],
  providers: [FirebaseService, AuthService],
  exports: [FirebaseService, AuthService],
})
export class AuthModule {}
