import { Injectable } from '@nestjs/common';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { CreateFileDto } from './dto/create-file.dto';
import { PresignedUrl } from '@common/types/presigned-url';
import { FileBuffer } from './types/file-buffer.interface';

@Injectable()
export class FileService {
  private storageService = new AzureBlobStorageService();

  async uploadFiles(
    files: CreateFileDto[],
    projectId: string,
  ): Promise<PresignedUrl[]> {
    return this.storageService.uploadFiles(files, projectId);
  }

  async getFiles(projectId: string): Promise<CreateFileDto[]> {
    return this.storageService.getFiles(projectId);
  }

  async readAllFilesAsBuffers(projectId: string): Promise<Buffer[]> {
    return this.storageService.readAllFilesAsBuffers(projectId);
  }

  async readAllFilesAsBuffersWithMetadata(
    projectId: string,
  ): Promise<FileBuffer[]> {
    return this.storageService.readAllFilesAsBuffersWithMetadata(projectId);
  }

  async deleteFile(projectId: string, fileName: string): Promise<void> {
    return this.storageService.deleteFile(projectId, fileName);
  }
}
