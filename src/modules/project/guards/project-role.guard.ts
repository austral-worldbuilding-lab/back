import {
  Injectable,
  SetMetadata,
  ExecutionContext,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@common/exceptions/custom-exceptions';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RequestWithUser } from '@modules/auth/types/auth.types';

export const REQUIRED_PROJECT_ROLES_KEY = 'requiredProjectRoles';
export const RequireProjectRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_PROJECT_ROLES_KEY, roles);

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user.id;
    const projectId = this.extractProjectId(request);

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

    if (!userRole) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    const requiredRoles = this.reflector.get<string[]>(
      REQUIRED_PROJECT_ROLES_KEY,
      context.getHandler(),
    );

    // If no specific roles are required, any role is enough
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(userRole.role.name)) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para realizar esta acción',
      );
    }

    return true;
  }

  private extractProjectId(request: RequestWithUser): string | undefined {
    return (
      (request.body as { projectId?: string })?.projectId ||
      (request.params as { projectId?: string; id?: string })?.projectId ||
      (request.params as { projectId?: string; id?: string })?.id ||
      (request.query as { projectId?: string })?.projectId
    );
  }
}
