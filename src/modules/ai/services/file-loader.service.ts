import {
  ResourceNotFoundException,
  ValidationException,
} from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { FileService } from '@modules/files/file.service';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { FileScope } from '@modules/files/types/file-scope.type';
import { Injectable } from '@nestjs/common';

import {
  CachedFileInfo,
  GeminiFileCacheService,
} from './gemini-file-cache.service';

export interface LoadFilesResult {
  toDownload: FileBuffer[];
  cached: CachedFileInfo[];
  scope: FileScope;
}

@Injectable()
export class FileLoaderService {
  constructor(
    private fileService: FileService,
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

    const filesToUse = await this.determineFilesToUse(selectedFiles, scope);

    const cached = await this.geminiCacheService.findValidCached(
      scope,
      filesToUse,
    );

    const cachedFileNames = new Set(cached.map((f) => f.fileName));
    const fileNamesToDownload = filesToUse.filter(
      (name) => !cachedFileNames.has(name),
    );

    if (fileNamesToDownload.length === 0) {
      this.logger.log('All files found in cache, no downloads needed', {
        totalFiles: filesToUse.length,
      });
      return { toDownload: [], cached, scope };
    }

    this.logger.log(
      `Downloading ${fileNamesToDownload.length}/${filesToUse.length} files from blob storage`,
      { cached: cached.length, toDownload: fileNamesToDownload.length },
    );

    const allFileBuffers =
      await this.fileService.readAllFilesAsBuffersWithMetadata(scope);

    const toDownload = allFileBuffers.filter((file) =>
      fileNamesToDownload.includes(file.fileName),
    );

    return { toDownload, cached, scope };
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
