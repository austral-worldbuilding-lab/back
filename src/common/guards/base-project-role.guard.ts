import { ForbiddenException } from '@common/exceptions/custom-exceptions';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { PrismaService } from '@modules/prisma/prisma.service';
import {
  Injectable,
  SetMetadata,
  ExecutionContext,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRED_PROJECT_ROLES_KEY = 'requiredProjectRoles';
export const RequireProjectRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_PROJECT_ROLES_KEY, roles);

@Injectable()
export abstract class BaseProjectRoleGuard implements CanActivate {
  constructor(
    protected prisma: PrismaService,
    protected reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user.id;
    const projectId = await this.extractProjectId(request);

    if (!userId || !projectId) {
      throw new ForbiddenException('ID de usuario o proyecto no especificado');
    }

    const userRole = await this.prisma.userProjectRole.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: projectId,
        },
      },
      include: {
        role: true,
      },
    });

    let effectiveRole: { role: { id: string; name: string } } | null = userRole;

    if (!userRole) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (!project) {
        throw new ForbiddenException('Proyecto no encontrado');
      }

      const orgRole = await this.prisma.userOrganizationRole.findUnique({
        where: {
          userId_organizationId: {
            userId: userId,
            organizationId: project.organizationId,
          },
        },
        include: {
          role: true,
        },
      });

      if (!orgRole) {
        throw new ForbiddenException('No tienes acceso a este proyecto');
      }

      effectiveRole = orgRole;
    }

    const requiredRoles = this.reflector.get<string[]>(
      REQUIRED_PROJECT_ROLES_KEY,
      context.getHandler(),
    );

    // If no specific roles are required, any role is enough
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(effectiveRole!.role.name)) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para realizar esta acción',
      );
    }

    return true;
  }

  protected abstract extractProjectId(
    request: RequestWithUser,
  ): Promise<string | undefined>;
}
