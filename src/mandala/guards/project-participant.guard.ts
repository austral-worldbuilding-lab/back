import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '../../common/exceptions/custom-exceptions';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithUser } from '../../auth/types/auth.types';

@Injectable()
export class ProjectParticipantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user.id;
    const projectId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
