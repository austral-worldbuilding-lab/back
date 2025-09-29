import {
  ResourceNotFoundException,
  ValidationException,
} from '@common/exceptions/custom-exceptions';
import { FileService } from '@modules/files/file.service';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { Injectable, Logger } from '@nestjs/common';
import { FileScope } from '@modules/files/types/file-scope.type';

@Injectable()
export class FileLoaderService {
  private readonly logger = new Logger(FileLoaderService.name);

  constructor(private fileService: FileService) {}

  async loadFiles(
    projectId: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<FileBuffer[]> {
    this.logger.debug(
      `Loading files for project: ${projectId}${mandalaId ? `, mandala: ${mandalaId}` : ''}`,
    );

    const scope = mandalaId
      ? await this.fileService.resolveScope('mandala', mandalaId)
      : await this.fileService.resolveScope('project', projectId);

    const allFileBuffers =
      await this.fileService.readAllFilesAsBuffersWithMetadata(scope);

    const filesToUse = await this.determineFilesToUse(selectedFiles, scope);

    return allFileBuffers.filter((file) => filesToUse.includes(file.fileName));
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
    fileBuffers: FileBuffer[],
    selectedFiles?: string[],
    filesToUse?: string[],
  ): void {
    if (fileBuffers.length === 0) {
      const errorDetails = {
        selectedFilesCount: selectedFiles?.length || 0,
        filesToUseCount: filesToUse?.length || 0,
        loadedFilesCount: fileBuffers.length,
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
