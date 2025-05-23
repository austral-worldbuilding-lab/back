import { Injectable } from '@nestjs/common';
import { AzureBlobStorageService } from '../storage/AzureBlobStorageService';
import { FileDescriptor } from '../storage/StorageService';

@Injectable()
export class FileService {
  private storageService = new AzureBlobStorageService();

  async uploadFiles(
    files: FileDescriptor[],
    projectId: string,
  ): Promise<string[]> {
    return this.storageService.uploadFiles(files, projectId);
  }

  async getFiles(projectId: string): Promise<FileDescriptor[]> {
    return this.storageService.getFiles(projectId);
  }

  async readAllFilesAsBuffers(projectId: string): Promise<Buffer[]> {
    return this.storageService.readAllFilesAsBuffers(projectId);
  }
}
