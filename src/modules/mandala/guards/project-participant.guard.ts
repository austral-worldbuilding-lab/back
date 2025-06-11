import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ForbiddenException } from '@common/exceptions/custom-exceptions';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RequestWithUser } from '@modules/auth/types/auth.types';

@Injectable()
export class ProjectParticipantGuard implements CanActivate {
  private readonly logger = new Logger(ProjectParticipantGuard.name);
  
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user.id;
    const projectId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.body?.projectId as string | undefined) ||
      (request.params?.projectId as string | undefined) ||
      (request.params?.id as string | undefined) ||
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

    this.logger.debug(`userRole: ${userRole}`);
    this.logger.debug(`userId: ${userId}`);
    this.logger.debug(`projectId: ${projectId}`);

    if (!userRole) {
      throw new ForbiddenException('User does not have access to this project');
    }

    return true;
  }
}
