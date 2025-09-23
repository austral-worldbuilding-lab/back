import { FileScope } from '../types/file-scope.type';

export const buildContextPath = (scope: FileScope): string => {
  let path = `/org/${scope.orgId}`;

  if (scope.projectId) {
    path += `/project/${scope.projectId}`;
  }

  if (scope.mandalaId) {
    path += `/mandala/${scope.mandalaId}`;
  }

  return path;
};

export const buildContextPathForSource = (
  currentScope: FileScope,
  sourceScope: 'org' | 'project' | 'mandala',
): string => {
  switch (sourceScope) {
    case 'org':
      return `/org/${currentScope.orgId}`;
    case 'project':
      if (!currentScope.projectId) {
        throw new Error('Project ID required for project-scoped files');
      }
      return `/org/${currentScope.orgId}/project/${currentScope.projectId}`;
    case 'mandala':
      if (!currentScope.projectId || !currentScope.mandalaId) {
        throw new Error(
          'Project ID and Mandala ID required for mandala-scoped files',
        );
      }
      return `/org/${currentScope.orgId}/project/${currentScope.projectId}/mandala/${currentScope.mandalaId}`;
  }
};
