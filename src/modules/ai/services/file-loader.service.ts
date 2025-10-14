import {
  ResourceNotFoundException,
  ValidationException,
} from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { FileService } from '@modules/files/file.service';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { EffectiveFile, FileScope } from '@modules/files/types/file-scope.type';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable } from '@nestjs/common';

import {
  CachedFileInfo,
  GeminiFileCacheService,
} from './gemini-file-cache.service';

export interface FileBufferWithScope extends FileBuffer {
  sourceScope: string; // 'org', 'project', o 'mandala'
}

export interface LoadFilesResult {
  toDownload: FileBufferWithScope[];
  cached: CachedFileInfo[];
  scope: FileScope;
}

@Injectable()
export class FileLoaderService {
  constructor(
    private fileService: FileService,
    private storageService: AzureBlobStorageService,
    private geminiCacheService: GeminiFileCacheService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FileLoaderService.name);
  }

  async loadFiles(
    projectId: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<LoadFilesResult> {
    this.logger.debug(
      `Loading files for project: ${projectId}${mandalaId ? `, mandala: ${mandalaId}` : ''}`,
    );

    const scope = mandalaId
      ? await this.fileService.resolveScope('mandala', mandalaId)
      : await this.fileService.resolveScope('project', projectId);

    const allEffectiveFiles = await this.fileService.getFiles(scope);
    const filesToUse = await this.determineFilesToUse(selectedFiles, scope);

    const effectiveFilesToProcess = allEffectiveFiles.filter((ef) =>
      filesToUse.includes(ef.file_name),
    );

    const cacheResults = await this.findCachedBySourceScope(
      effectiveFilesToProcess,
      scope,
    );

    if (cacheResults.toDownload.length === 0) {
      this.logger.log('All files found in cache, no downloads needed', {
        totalFiles: filesToUse.length,
      });
      return { toDownload: [], cached: cacheResults.cached, scope };
    }

    this.logger.log(
      `Downloading ${cacheResults.toDownload.length}/${filesToUse.length} files from blob storage`,
      {
        cached: cacheResults.cached.length,
        toDownload: cacheResults.toDownload.length,
      },
    );

    const fileBuffers = await Promise.all(
      cacheResults.toDownload.map(async (ef) => {
        const buffer = await this.storageService.getFileBuffer(
          ef.file_name,
          this.buildScopeFromSourceScope(ef.source_scope, scope),
        );
        return {
          buffer,
          fileName: ef.file_name,
          mimeType: ef.file_type,
          sourceScope: ef.source_scope, // ← Incluir el source_scope real
        } as FileBufferWithScope;
      }),
    );

    return { toDownload: fileBuffers, cached: cacheResults.cached, scope };
  }

  private async findCachedBySourceScope(
    effectiveFiles: EffectiveFile[],
    requestScope: FileScope,
  ): Promise<{ cached: CachedFileInfo[]; toDownload: EffectiveFile[] }> {
    const cached: CachedFileInfo[] = [];
    const toDownload: EffectiveFile[] = [];

    for (const effectiveFile of effectiveFiles) {
      const fileScope = this.buildScopeFromSourceScope(
        effectiveFile.source_scope,
        requestScope,
      );
      const cachedFiles = await this.geminiCacheService.findValidCached(
        fileScope,
        effectiveFile.file_name,
      );

      if (cachedFiles.length > 0) {
        cached.push(cachedFiles[0]);
      } else {
        toDownload.push(effectiveFile);
      }
    }

    this.logger.debug(`Cach Hit files: ${cached.length}`);
    this.logger.debug(`Cache Miss files: ${toDownload.length}`);

    return { cached, toDownload };
  }

  private buildScopeFromSourceScope(
    sourceScope: string,
    requestScope: FileScope,
  ): FileScope {
    switch (sourceScope) {
      case 'org':
        return { orgId: requestScope.orgId };
      case 'project':
        return {
          orgId: requestScope.orgId,
          projectId: requestScope.projectId,
        };
      case 'mandala':
        return requestScope;
      default:
        return requestScope;
    }
  }

  private async determineFilesToUse(
    selectedFiles: string[] | undefined,
    scope: FileScope,
  ): Promise<string[]> {
    if (selectedFiles?.length) {
      return selectedFiles;
    }
    return await this.fileService.getSelectedFileNames(scope);
  }

  validateFilesLoaded(
    result: LoadFilesResult,
    selectedFiles?: string[],
    filesToUse?: string[],
  ): void {
    const totalFiles = result.toDownload.length + result.cached.length;

    if (totalFiles === 0) {
      const errorDetails = {
        selectedFilesCount: selectedFiles?.length || 0,
        filesToUseCount: filesToUse?.length || 0,
        loadedFilesCount: totalFiles,
        cachedFilesCount: result.cached.length,
        downloadedFilesCount: result.toDownload.length,
        selectedFiles: selectedFiles || [],
        filesToUse: filesToUse || [],
      };

      if (selectedFiles?.length) {
        throw new ResourceNotFoundException(
          'Files',
          selectedFiles.join(', '),
          errorDetails,
        );
      } else if (filesToUse?.length === 0) {
        throw new ValidationException(
          'fileSelection',
          filesToUse,
          'No files are currently selected for processing',
          errorDetails,
        );
      } else {
        throw new ValidationException(
          'fileSelection',
          filesToUse || [],
          'No matching files found for processing',
          errorDetails,
        );
      }
    }
  }
}
