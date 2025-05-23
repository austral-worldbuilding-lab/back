export interface FileDescriptor {
  file_name: string;
  file_type: string;
}

export interface StorageService {
  uploadFiles(files: FileDescriptor[], projectId: string): Promise<string[]>;
  getFiles(projectId: string): Promise<FileDescriptor[]>;
  readAllFilesAsBuffers(folder: string): Promise<Buffer[]>;
}
