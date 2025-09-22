import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PresignedUrl } from '@common/types/presigned-url';
import { PrismaService } from '@modules/prisma/prisma.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { buildPrefix } from '@modules/storage/path-builder';
import { Injectable } from '@nestjs/common';

import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileSelectionDto } from './dto/file-selection.dto';
import { FileSelectionRepository } from './repositories/file-selection.repository';
import { FileBuffer } from './types/file-buffer.interface';
import {
  FileScope,
  FileSource,
  EffectiveFile,
  EffectiveFileWithSelection,
} from './types/file-scope.type';

@Injectable()
export class FileService {
  private storageService = new AzureBlobStorageService();

  constructor(
    private prisma: PrismaService,
    private fileSelectionRepository: FileSelectionRepository,
  ) {}

  async resolveScope(
    scopeType: 'org' | 'project' | 'mandala',
    id: string,
  ): Promise<FileScope> {
    switch (scopeType) {
      case 'org':
        return { orgId: id };

      case 'project': {
        const project = await this.prisma.project.findFirst({
          where: { id, isActive: true },
          select: { organizationId: true },
        });

        if (!project || !project.organizationId) {
          throw new ResourceNotFoundException('Project', id);
        }

        return { orgId: project.organizationId, projectId: id };
      }

      case 'mandala': {
        const mandala = await this.prisma.mandala.findFirst({
          where: { id, isActive: true },
          select: {
            projectId: true,
            project: { select: { organizationId: true } },
          },
        });

        if (!mandala || !mandala.project.organizationId) {
          throw new ResourceNotFoundException('Mandala', id);
        }

        return {
          orgId: mandala.project.organizationId,
          projectId: mandala.projectId,
          mandalaId: id,
        };
      }

      default:
        throw new Error(`Invalid scope type`);
    }
  }

  private getScopesForInheritance(scope: FileScope): FileScope[] {
    const scopes: FileScope[] = [];

    scopes.push({ orgId: scope.orgId });

    if (scope.projectId) {
      scopes.push({ orgId: scope.orgId, projectId: scope.projectId });
    }

    if (scope.mandalaId) {
      scopes.push(scope);
    }

    return scopes;
  }

  private async mapToEffectiveFiles(
    files: CreateFileDto[],
    source: FileSource,
    scope: FileScope,
  ): Promise<EffectiveFile[]> {
    const effectiveFilesPromises = files.map(async (file) => {
      const fullPath = this.buildFilePath(scope, file.file_name);
      const url = await this.storageService.generateDownloadUrl(fullPath);

      return {
        file_name: file.file_name,
        file_type: file.file_type,
        source_scope: source,
        full_path: fullPath,
        url: url,
      };
    });

    return Promise.all(effectiveFilesPromises);
  }

  private buildFilePath(scope: FileScope, fileName: string): string {
    return `${buildPrefix(scope, 'files')}${fileName}`;
  }

  async uploadFiles(
    files: CreateFileDto[],
    scope: FileScope,
  ): Promise<PresignedUrl[]> {
    return this.storageService.uploadFiles(files, scope, 'files');
  }

  async getFiles(scope: FileScope): Promise<EffectiveFile[]> {
    const scopes = this.getScopesForInheritance(scope);
    const allFiles: EffectiveFile[] = [];

    for (const inheritanceScope of scopes) {
      const files = await this.storageService.getFiles(inheritanceScope);
      const source: FileSource = this.getScopeSource(inheritanceScope);
      const effectiveFiles = await this.mapToEffectiveFiles(
        files,
        source,
        inheritanceScope,
      );
      allFiles.push(...effectiveFiles);
    }

    return allFiles;
  }

  private getScopeSource(scope: FileScope): FileSource {
    if (scope.mandalaId) return 'mandala';
    if (scope.projectId) return 'project';
    return 'org';
  }

  async readAllFilesAsBuffers(scope: FileScope): Promise<Buffer[]> {
    const scopes = this.getScopesForInheritance(scope);
    const allBuffers: Buffer[] = [];

    for (const inheritanceScope of scopes) {
      const buffers =
        await this.storageService.readAllFilesAsBuffers(inheritanceScope);
      allBuffers.push(...buffers);
    }

    return allBuffers;
  }

  async readAllFilesAsBuffersWithMetadata(
    scope: FileScope,
  ): Promise<FileBuffer[]> {
    const scopes = this.getScopesForInheritance(scope);
    const allFileBuffers: FileBuffer[] = [];

    for (const inheritanceScope of scopes) {
      const fileBuffers =
        await this.storageService.readAllFilesAsBuffersWithMetadata(
          inheritanceScope,
        );
      allFileBuffers.push(...fileBuffers);
    }

    return allFileBuffers;
  }

  async countProjectFiles(projectId: string): Promise<number> {
    const scope = await this.resolveScope('project', projectId);
    const projectScope: FileScope = {
      orgId: scope.orgId,
      projectId: scope.projectId,
    };

    return this.storageService.countFilesInScope(projectScope);
  }

  async deleteFile(scope: FileScope, fileName: string): Promise<void> {
    return this.storageService.deleteFile(scope, fileName, 'files');
  }

  private getActualFileScope(file: EffectiveFile, requestedScope: FileScope): FileScope {
    if (file.source_scope === 'org') {
      return { orgId: requestedScope.orgId };
    } else if (file.source_scope === 'project') {
      return { orgId: requestedScope.orgId, projectId: requestedScope.projectId };
    } else {
      return requestedScope;
    }
  }

  async getFilesWithSelection(
    scope: FileScope,
  ): Promise<EffectiveFileWithSelection[]> {
    const files = await this.getFiles(scope);
    
    const filesByScope = new Map<string, EffectiveFile[]>();
    for (const file of files) {
      const actualScope = this.getActualFileScope(file, scope);
      const scopeKey = JSON.stringify(actualScope);
      if (!filesByScope.has(scopeKey)) {
        filesByScope.set(scopeKey, []);
      }
      filesByScope.get(scopeKey)!.push(file);
    }

    const allSelections = new Map<string, boolean>();
    for (const [scopeKey, scopeFiles] of filesByScope) {
      const actualScope = JSON.parse(scopeKey) as FileScope;
      const fileSelections = await this.fileSelectionRepository.getFileSelections(actualScope);
      
      for (const file of scopeFiles) {
        const selected = fileSelections.get(file.file_name) ?? true;
        allSelections.set(file.file_name, selected);
      }
    }

    return files.map((file) => ({
      ...file,
      selected: allSelections.get(file.file_name) ?? true,
    }));
  }

  async updateFileSelections(
    scope: FileScope,
    selections: UpdateFileSelectionDto[],
  ): Promise<void> {
    const existingFiles = await this.getFiles(scope);
    const existingFileNames = existingFiles.map((file) => file.file_name);
    const invalidFiles = selections
      .map((s) => s.fileName)
      .filter((fileName) => !existingFileNames.includes(fileName));

    if (invalidFiles.length > 0) {
      throw new ResourceNotFoundException(
        'Files',
        invalidFiles.join(', '),
        'These files do not exist in the specified scope',
      );
    }

    const selectionsByScope = new Map<string, UpdateFileSelectionDto[]>();
    
    for (const selection of selections) {
      const file = existingFiles.find(f => f.file_name === selection.fileName);
      if (file) {
        const actualScope = this.getActualFileScope(file, scope);
        const scopeKey = JSON.stringify(actualScope);
        if (!selectionsByScope.has(scopeKey)) {
          selectionsByScope.set(scopeKey, []);
        }
        selectionsByScope.get(scopeKey)!.push(selection);
      }
    }

    for (const [scopeKey, scopeSelections] of selectionsByScope) {
      const actualScope = JSON.parse(scopeKey) as FileScope;
      await this.fileSelectionRepository.updateFileSelections(actualScope, scopeSelections);
    }

    await this.fileSelectionRepository.deleteSelectionsForMissingFiles(
      scope,
      existingFileNames,
    );
  }

  async getSelectedFileNames(scope: FileScope): Promise<string[]> {
    const filesWithSelection = await this.getFilesWithSelection(scope);
    return filesWithSelection
      .filter((file) => file.selected)
      .map((file) => file.file_name);
  }
}
