import {
  BaseOrganizationRoleGuard,
  RequireOrganizationRoles,
} from '@common/guards/base-organization-role.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export { RequireOrganizationRoles };

@Injectable()
export class OrganizationFileRoleGuard extends BaseOrganizationRoleGuard {
  constructor(prisma: PrismaService, reflector: Reflector) {
    super(prisma, reflector);
  }

  protected extractOrganizationId(
    request: RequestWithUser,
  ): Promise<string | undefined> {
    // For organization file operations, orgId is in the URL params
    const orgId = (request.params as { orgId?: string })?.orgId;

    return Promise.resolve(orgId);
  }
}
