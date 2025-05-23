import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FileService } from './file.service';
import { FileDescriptor } from '../storage/StorageService';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':projectId')
  async getFiles(
    @Param('projectId') projectId: string,
  ): Promise<FileDescriptor[]> {
    return this.fileService.getFiles(projectId);
  }

  @Post(':projectId')
  async uploadFiles(
    @Param('projectId') projectId: string,
    @Body() body: FileDescriptor[],
  ): Promise<string[]> {
    return this.fileService.uploadFiles(body, projectId);
  }

  @Get(':projectId/buffers')
  async getFileBuffers(
    @Param('projectId') projectId: string,
  ): Promise<Buffer[]> {
    return this.fileService.readAllFilesAsBuffers(projectId);
  }
}
