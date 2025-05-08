import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class ProjectParticipantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'] as string | undefined; // Assuming token will be later passed
    const projectId =
      (request.body?.projectId as string | undefined) ||
      (request.params?.projectId as string | undefined) ||
      (request.query?.projectId as string | undefined);

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
    });

    if (!userRole) {
      throw new ForbiddenException('User does not have access to this project');
    }

    return true;
  }
}
