import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FileService } from './file.service';

import { CreateFileDto } from './dto/create-file.dto';
import { DataResponse } from '../common/types/responses';
import { PresignedUrl } from '../common/types/presigned-url';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':projectId')
  async getFiles(
    @Param('projectId') projectId: string,
  ): Promise<DataResponse<CreateFileDto[]>> {
    const response = await this.fileService.getFiles(projectId);
    return { data: response };
  }

  @Post(':projectId')
  async uploadFiles(
    @Param('projectId') projectId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const response = await this.fileService.uploadFiles(body, projectId);
    return { data: response };
  }

  @Get(':projectId/buffers')
  async getFileBuffers(
    @Param('projectId') projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const response = await this.fileService.readAllFilesAsBuffers(projectId);
    return { data: response };
  }
}
