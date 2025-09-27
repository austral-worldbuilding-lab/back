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
import { UniqueFileNameGenerator } from './utils/unique-filename.utils';

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
    this.validateFilesForUpload(files);

    const existingFiles = await this.storageService.getFiles(scope);
    const existingFileNames = existingFiles.map((file) => file.file_name);

    const nameMapping = UniqueFileNameGenerator.generateUniqueFileNames(
      files,
      existingFileNames,
    );

    const filesWithUniqueNames = files.map((file, index) => ({
      ...file,
      file_name: nameMapping[index].uniqueName,
    }));

    return this.storageService.uploadFiles(
      filesWithUniqueNames,
      scope,
      'files',
    );
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

  private getActualFileScope(
    file: EffectiveFile,
    requestedScope: FileScope,
  ): FileScope {
    if (file.source_scope === 'org') {
      return { orgId: requestedScope.orgId };
    } else if (file.source_scope === 'project') {
      return {
        orgId: requestedScope.orgId,
        projectId: requestedScope.projectId,
      };
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

    const selectionsByScopeAndFile = new Map<string, boolean>();

    for (const [scopeKey, scopeFiles] of filesByScope) {
      const actualScope = JSON.parse(scopeKey) as FileScope;
      const fileSelections =
        await this.fileSelectionRepository.getFileSelections(actualScope);

      for (const file of scopeFiles) {
        const selected = fileSelections.get(file.file_name) ?? true;
        const uniqueKey = `${scopeKey}:${file.file_name}`;
        selectionsByScopeAndFile.set(uniqueKey, selected);
      }
    }

    return files.map((file) => {
      const actualScope = this.getActualFileScope(file, scope);
      const scopeKey = JSON.stringify(actualScope);
      const uniqueKey = `${scopeKey}:${file.file_name}`;

      return {
        ...file,
        selected: selectionsByScopeAndFile.get(uniqueKey) ?? true,
      };
    });
  }

  async updateFileSelections(
    scope: FileScope,
    selections: UpdateFileSelectionDto[],
  ): Promise<void> {
    const existingFiles = await this.getFiles(scope);

    // Create a map of file existence by fileName and sourceScope
    const fileExistenceMap = new Map<string, Set<string>>();
    for (const file of existingFiles) {
      if (!fileExistenceMap.has(file.file_name)) {
        fileExistenceMap.set(file.file_name, new Set());
      }
      fileExistenceMap.get(file.file_name)!.add(file.source_scope);
    }

    // Validate that each selection references an existing file in the correct scope
    const invalidFiles: string[] = [];
    for (const selection of selections) {
      const availableScopes = fileExistenceMap.get(selection.fileName);
      if (!availableScopes || !availableScopes.has(selection.sourceScope)) {
        invalidFiles.push(
          `${selection.fileName} (scope: ${selection.sourceScope})`,
        );
      }
    }

    if (invalidFiles.length > 0) {
      throw new ResourceNotFoundException(
        'Files',
        invalidFiles.join(', '),
        'These files do not exist in the specified scope',
      );
    }

    const selectionsByScope = new Map<string, UpdateFileSelectionDto[]>();

    for (const selection of selections) {
      const targetFile = existingFiles.find(
        (file) =>
          file.file_name === selection.fileName &&
          file.source_scope === selection.sourceScope,
      );

      if (!targetFile) {
        throw new ResourceNotFoundException(
          'File',
          `${selection.fileName} (scope: ${selection.sourceScope})`,
          'File not found in the specified scope',
        );
      }

      const actualScope = this.getActualFileScope(targetFile, scope);

      const scopeKey = JSON.stringify(actualScope);
      if (!selectionsByScope.has(scopeKey)) {
        selectionsByScope.set(scopeKey, []);
      }
      selectionsByScope.get(scopeKey)!.push(selection);
    }

    for (const [scopeKey, scopeSelections] of selectionsByScope) {
      const actualScope = JSON.parse(scopeKey) as FileScope;
      await this.fileSelectionRepository.updateFileSelections(
        actualScope,
        scopeSelections,
      );
    }

    const existingFileNames = existingFiles.map((file) => file.file_name);
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

  private validateFilesForUpload(files: CreateFileDto[]): void {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    files.forEach((file, index) => {
      if (!file.file_name || file.file_name.trim() === '') {
        throw new Error(`File at index ${index} has invalid name`);
      }

      if (file.file_name.length > 255) {
        throw new Error(
          `File name at index ${index} is too long (max 255 characters)`,
        );
      }
    });
  }
}
