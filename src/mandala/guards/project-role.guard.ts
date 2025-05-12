import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

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
    const request = context.switchToHttp().getRequest<Request>();

    const userId = request.headers['x-user-id'] as string | undefined;
    const projectId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.body?.projectId as string | undefined) ||
      (request.params?.projectId as string | undefined) ||
      (request.query?.projectId as string | undefined);

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
