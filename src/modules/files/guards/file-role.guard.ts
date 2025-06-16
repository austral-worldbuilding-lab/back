import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import {
  BaseProjectRoleGuard,
  RequireProjectRoles,
} from '@common/guards/base-project-role.guard';

export { RequireProjectRoles };

@Injectable()
export class FileRoleGuard extends BaseProjectRoleGuard {
  constructor(prisma: PrismaService, reflector: Reflector) {
    super(prisma, reflector);
  }

  protected extractProjectId(
    request: RequestWithUser,
  ): Promise<string | undefined> {
    // For file operations, projectId is always in the URL params
    const projectId = (request.params as { projectId?: string })?.projectId;

    return Promise.resolve(projectId);
  }
} 