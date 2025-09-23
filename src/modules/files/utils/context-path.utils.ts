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

export const parseContextPath = (contextPath: string): FileScope => {
  const parts = contextPath.split('/').filter(p => p);
  const result: any = {};
  
  for (let i = 0; i < parts.length; i += 2) {
    const key = parts[i];
    const value = parts[i + 1];
    
    if (key === 'org') result.orgId = value;
    else if (key === 'project') result.projectId = value;
    else if (key === 'mandala') result.mandalaId = value;
  }
  
  return result as FileScope;
};

export const buildContextPathForSource = (
  currentScope: FileScope,
  sourceScope: 'org' | 'project' | 'mandala'
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
        throw new Error('Project ID and Mandala ID required for mandala-scoped files');
      }
      return `/org/${currentScope.orgId}/project/${currentScope.projectId}/mandala/${currentScope.mandalaId}`;
    default:
      throw new Error(`Invalid source scope: ${sourceScope}`);
  }
};

export const buildFullS3Path = (contextPath: string, fileName: string): string => {
  return `${contextPath}/file/${fileName}`;
};
