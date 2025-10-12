import { FileScope } from '@modules/files/types/file-scope.type';

export type StorageFolder = 'files' | 'images' | 'encyclopedia';

export function buildPrefix(
  scope: FileScope,
  folderName: StorageFolder,
): string {
  if (scope.mandalaId) {
    if (!scope.projectId || !scope.orgId) {
      throw new Error(
        'Mandala scope requires both projectId and orgId to be defined',
      );
    }
    return `org/${scope.orgId}/project/${scope.projectId}/mandala/${scope.mandalaId}/${folderName}/`;
  }

  if (scope.projectId) {
    if (!scope.orgId) {
      throw new Error('Project scope requires orgId to be defined');
    }
    return `org/${scope.orgId}/project/${scope.projectId}/${folderName}/`;
  }

  return `org/${scope.orgId}/${folderName}/`;
}
