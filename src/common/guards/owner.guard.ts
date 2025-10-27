import { RequireProjectRoles } from './base-project-role.guard';

export const RequireOwner = () => RequireProjectRoles('dueño');
