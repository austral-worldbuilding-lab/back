import { ForbiddenException } from '@common/exceptions/custom-exceptions';
import {
  BaseProjectRoleGuard,
  RequireProjectRoles,
} from '@common/guards/base-project-role.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export { RequireProjectRoles };

@Injectable()
export class MandalaRoleGuard extends BaseProjectRoleGuard {
  constructor(prisma: PrismaService, reflector: Reflector) {
    super(prisma, reflector);
  }

  protected async extractProjectId(
    request: RequestWithUser,
  ): Promise<string | undefined> {
    const directProjectId =
      (request.body as { projectId?: string })?.projectId ||
      (request.params as { projectId?: string })?.projectId ||
      (request.query as { projectId?: string })?.projectId;

    if (directProjectId) {
      return directProjectId;
    }

    const mandalaId =
      (request.params as { id?: string })?.id ||
      (request.body as { mandalaId?: string })?.mandalaId ||
      (request.params as { mandalaId?: string })?.mandalaId ||
      (request.query as { id?: string })?.id ||
      (request.query as { mandalaId?: string })?.mandalaId;

    if (mandalaId) {
      const mandala = await this.prisma.mandala.findUnique({
        where: { id: mandalaId },
        select: { projectId: true },
      });

      if (!mandala) {
        throw new ForbiddenException('Mandala no encontrado');
      }

      return mandala.projectId;
    }

    return undefined;
  }
}
