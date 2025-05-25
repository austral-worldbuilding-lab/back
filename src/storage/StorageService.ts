import { CreateFileDto } from '../files/dto/create-file.dto';
import { PresignedUrl } from '../common/types/presigned-url';
import { FileBuffer } from '../files/types/file-buffer.interface';

export interface StorageService {
  uploadFiles(
    files: CreateFileDto[],
    projectId: string,
  ): Promise<PresignedUrl[]>;
  getFiles(projectId: string): Promise<CreateFileDto[]>;
  readAllFilesAsBuffers(folder: string): Promise<Buffer[]>;
  readAllFilesAsBuffersWithMetadata(folder: string): Promise<FileBuffer[]>;
}
