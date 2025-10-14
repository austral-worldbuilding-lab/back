import { AppLogger } from '@common/services/logger.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_TRANSPORT') private readonly transport: Transporter,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MailService.name);
  }

  async sendInvitationEmail(params: {
    to: string;
    inviteeName?: string;
    invitedByName: string;
    projectName: string;
    token: string;
    organizationId?: string;
    projectId?: string;
  }) {
    const baseUrl = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';
    let acceptUrl = `${baseUrl}/invite/${encodeURIComponent(params.token)}`;
    if (params.organizationId && params.projectId) {
      acceptUrl += `?org=${encodeURIComponent(params.organizationId)}&project=${encodeURIComponent(params.projectId)}`;
    }

    if (!params.projectId) {
      acceptUrl = `${baseUrl}/organization-invite/${encodeURIComponent(params.token)}${params.organizationId ? `?org=${encodeURIComponent(params.organizationId)}` : ''}`;
    }

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
    invitedByName: string;
    projectName: string;
    acceptUrl: string;
  }) {
    return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invitación al Proyecto</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #172187;
            color: white;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 24px;
          }
          .content h2 {
            color: #172187;
          }
          .content p {
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            margin-top: 20px;
            background-color: #dba5e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          }
          .footer {
            font-size: 12px;
            text-align: center;
            color: #777;
            padding: 16px;
            background-color: #f3f3f3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invitación a colaborar</h1>
          </div>
          <div class="content">
            <h2>Hola ${data.inviteeName},</h2>
            <p>
              Has sido invitado por <strong>${data.invitedByName}</strong> a colaborar en
              el proyecto <strong>"${data.projectName}"</strong> en la plataforma de
              Worldbuilding.
            </p>
            <p>
              Para aceptar la invitación y comenzar a trabajar en el proyecto, hacé
              clic en el botón a continuación:
            </p>
            <a class="button" href="${data.acceptUrl}" target="_blank"
              >Unirme al proyecto</a
            >
            <p style="margin-top: 32px">
              Si no esperabas este correo, podés ignorarlo.
            </p>
          </div>
          <div class="footer">
            © 2025 AWBL · Este correo fue enviado automáticamente desde la
            plataforma.
          </div>
        </div>
      </body>
    </html>
    `;
  }
}
