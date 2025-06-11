import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { ForbiddenException } from '@common/exceptions/custom-exceptions';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RequestWithUser } from '@modules/auth/types/auth.types';

export const ALLOWED_ROLES_KEY = 'allowedRoles';
export const AllowedRoles = (...roles: string[]) =>
  SetMetadata(ALLOWED_ROLES_KEY, roles);

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user.id;
    let projectId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.body?.projectId as string | undefined) ||
      (request.params?.projectId as string | undefined) ||
      (request.query?.projectId as string | undefined);

    // If projectId is not provided, try to get it from the mandalaId
    if (!projectId) {
      const mandalaId =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (request.body?.mandalaId as string | undefined) ||
        (request.params?.mandalaId as string | undefined) ||
        (request.query?.mandalaId as string | undefined) ||
        (request.params?.id as string | undefined) ||
        (request.query?.id as string | undefined);

      if (mandalaId) {
        const mandala = await this.prisma.mandala.findUnique({
          where: { id: mandalaId },
          select: { projectId: true },
        });

        if (!mandala) {
          throw new ForbiddenException('Mandala not found');
        }

        projectId = mandala.projectId;
      }
    }

    const allowedRoles =
      this.reflector.get<string[]>(ALLOWED_ROLES_KEY, context.getHandler()) ??
      [];

    if (!userId || !projectId) {
      throw new ForbiddenException('User ID or project ID not specified');
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
      throw new ForbiddenException('User does not have access to this project');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole.role.name)) {
      throw new ForbiddenException(
        'User does not have permission to perform this action',
      );
    }

    return true;
  }
}
