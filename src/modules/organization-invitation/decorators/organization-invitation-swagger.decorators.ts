import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { OrganizationInvitationDto } from '../dto/organization-invitation.dto';

// ---------- Create ----------
export function ApiCreateOrgInvitation() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new organization invitation' }),
    ApiCreatedResponse({
      description: 'The organization invitation has been created',
      type: OrganizationInvitationDto,
    }),
  );
}

// ---------- Find All ----------
export function ApiGetAllOrgInvitations() {
  return applyDecorators(
    ApiOperation({ summary: 'Get paginated list of organization invitations' }),
    ApiOkResponse({
      description: 'Paginated list of organization invitations',
      type: [OrganizationInvitationDto],
    }),
    ApiQuery({ name: 'organizationId', required: false, type: String }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    }),
  );
}

// ---------- Find By Organization ----------
export function ApiGetOrgInvitationsByOrganization() {
  return applyDecorators(
    ApiOperation({ summary: 'Get invitations for a specific organization' }),
    ApiOkResponse({
      description: 'List of invitations for the organization',
      type: [OrganizationInvitationDto],
    }),
    ApiParam({ name: 'organizationId', type: String }),
  );
}

// ---------- Find One ----------
export function ApiGetOrgInvitation() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single organization invitation by id' }),
    ApiOkResponse({
      description: 'Organization invitation details',
      type: OrganizationInvitationDto,
    }),
    ApiParam({ name: 'id', type: String }),
  );
}

// ---------- Accept ----------
export function ApiAcceptOrgInvitation() {
  return applyDecorators(
    ApiOperation({ summary: 'Accept an organization invitation' }),
    ApiOkResponse({
      description: 'The invitation was accepted',
      type: OrganizationInvitationDto,
    }),
    ApiParam({ name: 'id', type: String }),
  );
}

// ---------- Reject ----------
export function ApiRejectOrgInvitation() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject an organization invitation' }),
    ApiOkResponse({
      description: 'The invitation was rejected',
      type: OrganizationInvitationDto,
    }),
    ApiParam({ name: 'id', type: String }),
  );
}

// ---------- Delete ----------
export function ApiDeleteOrgInvitation() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an organization invitation' }),
    ApiOkResponse({
      description: 'The invitation was deleted',
    }),
    ApiParam({ name: 'id', type: String }),
  );
}
