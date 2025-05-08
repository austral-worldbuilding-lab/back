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

  private extractProjectId(request: Request): string | undefined {
    const body = request.body as Record<string, unknown>;
    const params = request.params as Record<string, unknown>;
    const query = request.query as Record<string, unknown>;

    return (
      (body.projectId as string) ||
      (params.projectId as string) ||
      (query.projectId as string)
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'] as string | undefined; // Assuming token will be later passed
    const projectId = this.extractProjectId(request);

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
