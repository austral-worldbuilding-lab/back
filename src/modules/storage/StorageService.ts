import { PresignedUrl } from '@common/types/presigned-url';
import { CreateFileDto } from '@modules/files/dto/create-file.dto';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';

export interface StorageService {
  uploadFiles(
    files: CreateFileDto[],
    projectId: string,
  ): Promise<PresignedUrl[]>;
  getFiles(projectId: string): Promise<CreateFileDto[]>;
  readAllFilesAsBuffers(folder: string): Promise<Buffer[]>;
  readAllFilesAsBuffersWithMetadata(folder: string): Promise<FileBuffer[]>;
  deleteFile(projectId: string, fileName: string): Promise<void>;
}
