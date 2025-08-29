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
export class OrganizationInvitationRoleGuard extends BaseOrganizationRoleGuard {
  constructor(prisma: PrismaService, reflector: Reflector) {
    super(prisma, reflector);
  }

  protected extractOrganizationId(
    request: RequestWithUser,
  ): Promise<string | undefined> {
    const organizationId =
      (request.body as { organizationId?: string })?.organizationId ||
      (request.params as { organizationId?: string })?.organizationId ||
      (request.query as { organizationId?: string })?.organizationId;

    return Promise.resolve(organizationId);
  }
}
