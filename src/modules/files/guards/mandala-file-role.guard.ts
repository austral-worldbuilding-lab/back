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
export class MandalaFileRoleGuard extends BaseProjectRoleGuard {
  constructor(prisma: PrismaService, reflector: Reflector) {
    super(prisma, reflector);
  }

  protected async extractProjectId(
    request: RequestWithUser,
  ): Promise<string | undefined> {
    // For mandala file operations, mandalaId is in the URL params
    const mandalaId = (request.params as { mandalaId?: string })?.mandalaId;

    if (mandalaId) {
      const mandala = await this.prisma.mandala.findFirst({
        where: {
          id: mandalaId,
          isActive: true,
        },
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
