import { PresignedUrl } from '@common/types/presigned-url';
import { CreateFileDto } from '@modules/files/dto/create-file.dto';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { FileScope } from '@modules/files/types/file-scope.type';

export interface StorageService {
  uploadFiles(
    files: CreateFileDto[],
    scope: FileScope,
  ): Promise<PresignedUrl[]>;
  getFiles(scope: FileScope): Promise<CreateFileDto[]>;
  readAllFilesAsBuffers(scope: FileScope): Promise<Buffer[]>;
  readAllFilesAsBuffersWithMetadata(scope: FileScope): Promise<FileBuffer[]>;
  deleteFile(scope: FileScope, fileName: string): Promise<void>;
  generateDownloadUrl(fullPath: string, expirationHours?: number): Promise<string>;
}
