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

    // Handle overlap endpoint - validate access to all mandalas and extract project ID from first
    const overlapBody = request.body as { mandalas?: string[] };
    if (overlapBody?.mandalas && overlapBody.mandalas.length > 0) {
      const mandalaIds = overlapBody.mandalas;

      // Find all mandalas to validate access
      const mandalas = await this.prisma.mandala.findMany({
        where: {
          id: { in: mandalaIds },
          isActive: true,
        },
        select: { id: true, projectId: true },
      });

      if (mandalas.length !== mandalaIds.length) {
        throw new ForbiddenException('One or more mandalas not found');
      }

      // Check if user has access to ALL projects
      const userId = request.user.id;
      for (const mandala of mandalas) {
        const userRole = await this.prisma.userProjectRole.findUnique({
          where: {
            userId_projectId: {
              userId: userId,
              projectId: mandala.projectId,
            },
          },
        });

        if (!userRole) {
          throw new ForbiddenException(
            `No tienes acceso al proyecto ${mandala.projectId} (mandala: ${mandala.id})`,
          );
        }
      }

      // Return the first mandala's project ID for the base guard logic
      return mandalas[0]?.projectId;
    }

    const mandalaId =
      (request.params as { id?: string })?.id ||
      (request.body as { mandalaId?: string })?.mandalaId ||
      (request.params as { mandalaId?: string })?.mandalaId ||
      (request.query as { id?: string })?.id ||
      (request.query as { mandalaId?: string })?.mandalaId;

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
