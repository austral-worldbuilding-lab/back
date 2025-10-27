import { RequireOrganizationRoles } from './base-organization-role.guard';

export const RequireOrganizationOwner = () => RequireOrganizationRoles('dueño');
