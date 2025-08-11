// src/modules/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

import { MailService } from './mail.service';

import mailConfig from '@/config/mail.config';

interface MailSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

@Module({
  imports: [ConfigModule.forFeature(mailConfig)],
  providers: [
    MailService,
    {
      provide: 'MAIL_TRANSPORT',
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => {
        const conf = cfg.get<MailSettings>('mail')!;
        const transporter: Transporter = createTransport({
          host: conf.host,
          port: conf.port,
          secure: conf.secure,
          auth: { user: conf.user, pass: conf.password },
        });
        await transporter.verify();
        return transporter;
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
