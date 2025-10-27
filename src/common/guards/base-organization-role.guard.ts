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

export const REQUIRED_ORGANIZATION_ROLES_KEY = 'requiredOrganizationRoles';
export const RequireOrganizationRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_ORGANIZATION_ROLES_KEY, roles);

@Injectable()
export abstract class BaseOrganizationRoleGuard implements CanActivate {
  constructor(
    protected prisma: PrismaService,
    protected reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user.id;
    const organizationId = await this.extractOrganizationId(request);

    if (!userId || !organizationId) {
      throw new ForbiddenException(
        'ID de usuario u organización no especificado',
      );
    }

    const userRole = await this.prisma.userOrganizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      include: {
        role: true,
      },
    });

    const requiredRoles = this.reflector.get<string[]>(
      REQUIRED_ORGANIZATION_ROLES_KEY,
      context.getHandler(),
    );

    if (userRole) {
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

    const hasProjectAccess = await this.prisma.userProjectRole.findFirst({
      where: {
        userId: userId,
        project: {
          organizationId: organizationId,
        },
      },
    });

    if (!hasProjectAccess) {
      throw new ForbiddenException('No tienes acceso a esta organización');
    }

    if (requiredRoles && requiredRoles.length > 0) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para realizar esta acción en la organización',
      );
    }

    return true;
  }

  protected abstract extractOrganizationId(
    request: RequestWithUser,
  ): Promise<string | undefined>;
}
