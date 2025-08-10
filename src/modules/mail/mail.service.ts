import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    @Inject('MAIL_TRANSPORT') private readonly transport: Transporter,
    private readonly config: ConfigService,
  ) {}

  async sendInvitationEmail(params: {
    to: string;
    inviteeName?: string;
    projectName: string;
    token: string;
  }) {
    const baseUrl = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';
    const acceptUrl = `${baseUrl}/app/invite/accept?token=${encodeURIComponent(params.token)}`;

    const from = this.config.get<string>('mail.from');
    const subject = `Invitación a un proyecto: ${params.projectName}`;
    const html = this.buildInvitationHtml({ ...params, acceptUrl });

    try {
      await this.transport.sendMail({
        from,
        to: params.to,
        subject,
        html,
      });
      this.logger.log(`Invitation email sent to ${params.to}`);
    } catch (err) {
      this.logger.error(
        `Failed sending invitation to ${params.to}`,
        err as any,
      );
      throw err;
    }
  }

  private buildInvitationHtml(data: {
    inviteeName?: string;
    projectName: string;
    acceptUrl: string;
  }) {
    const greeting = data.inviteeName ? `Hola ${data.inviteeName},` : 'Hola,';
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#111">
        <p>${greeting}</p>
        <p>Te invitaron a unirte al proyecto <b>${data.projectName}</b>.</p>
        <p>Para aceptar la invitación, hacé clic en el botón:</p>
        <p>
          <a href="${data.acceptUrl}"
             style="background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">
            Aceptar invitación
          </a>
        </p>
        <p>Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
        <p><a href="${data.acceptUrl}">${data.acceptUrl}</a></p>
        <hr/>
        <p style="color:#555">Si no esperabas esta invitación, podés ignorar este correo.</p>
      </div>
    `;
  }
}
