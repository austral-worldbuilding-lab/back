import { FileScope } from '@modules/files/types/file-scope.type';

export function buildPrefix(scope: FileScope): string {
  if (scope.mandalaId) {
    if (!scope.projectId || !scope.orgId) {
      throw new Error('Mandala scope requires projectId and orgId');
    }
    return `org/${scope.orgId}/project/${scope.projectId}/mandala/${scope.mandalaId}/files/`;
  }

  if (scope.projectId) {
    if (!scope.orgId) {
      throw new Error('Project scope requires orgId');
    }
    return `org/${scope.orgId}/project/${scope.projectId}/files/`;
  }

  return `org/${scope.orgId}/files/`;
}
