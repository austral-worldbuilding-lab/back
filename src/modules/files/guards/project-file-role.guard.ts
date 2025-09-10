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
export class ProjectFileRoleGuard extends BaseProjectRoleGuard {
  constructor(prisma: PrismaService, reflector: Reflector) {
    super(prisma, reflector);
  }

  protected extractProjectId(
    request: RequestWithUser,
  ): Promise<string | undefined> {
    // For project file operations, projectId is in the URL params
    const projectId = (request.params as { projectId?: string })?.projectId;

    return Promise.resolve(projectId);
  }
}
