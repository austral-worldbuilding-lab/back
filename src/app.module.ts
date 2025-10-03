import { randomUUID } from 'node:crypto';
import * as process from 'node:process';

import { CommonModule } from '@common/common.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { UserThrottlerGuard } from '@common/guards/user-throttler.guard';
import { AppLogger } from '@common/services/logger.service';
import { AiModule } from '@modules/ai/ai.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FileModule } from '@modules/files/file.module';
import { HealthModule } from '@modules/health/health.module';
import { InvitationModule } from '@modules/invitation/invitation.module';
import { MailModule } from '@modules/mail/mail.module';
import { MandalaModule } from '@modules/mandala/mandala.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { OrganizationInvitationModule } from '@modules/organization-invitation/organization-invitation.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ProjectModule } from '@modules/project/project.module';
import { RoleModule } from '@modules/role/role.module';
import { UserModule } from '@modules/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls) => {
          cls.set('requestId', randomUUID());
        },
      },
    }),
    CommonModule,
    PrismaModule,
    ProjectModule,
    UserModule,
    InvitationModule,
    OrganizationInvitationModule,
    MandalaModule,
    AuthModule,
    FileModule,
    AiModule,
    RoleModule,
    MailModule,
    OrganizationModule,
    HealthModule,
    CacheModule.register({
      ttl: parseInt(process.env.CACHE_TTL || '7200000'),
      max: parseInt(process.env.CACHE_MAX_ITEMS || '500'),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000'),
          limit: parseInt(process.env.RATE_LIMIT_LIMIT || '1000000'),
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    AppLogger,
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [PrismaService, AppLogger],
})
export class AppModule {}
