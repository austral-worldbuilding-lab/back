import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { FileService } from './file.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateFileDto } from './dto/create-file.dto';
import { DataResponse, MessageOnlyResponse } from '@common/types/responses';
import { PresignedUrl } from '@common/types/presigned-url';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { FileRoleGuard } from './guards/file-role.guard';
import {
  ApiGetFiles,
  ApiUploadFiles,
  ApiGetFileBuffers,
  ApiDeleteFile,
} from './decorators/file-swagger.decorators';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';

@ApiTags('Files')
@Controller('files')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':projectId')
  @UseGuards(FileRoleGuard)
  @ApiGetFiles()
  async getFiles(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<CreateFileDto[]>> {
    const response = await this.fileService.getFiles(projectId);
    return { data: response };
  }

  @Post(':projectId')
  @UseGuards(FileRoleGuard)
  @ApiUploadFiles()
  async uploadFiles(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const response = await this.fileService.uploadFiles(body, projectId);
    return { data: response };
  }

  @Get(':projectId/buffers')
  @UseGuards(FileRoleGuard)
  @ApiGetFileBuffers()
  async getFileBuffers(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const response = await this.fileService.readAllFilesAsBuffers(projectId);
    return { data: response };
  }

  @Delete(':projectId/:fileName')
  @UseGuards(FileRoleGuard)
  @ApiDeleteFile()
  async deleteFile(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
  ): Promise<MessageOnlyResponse> {
    await this.fileService.deleteFile(projectId, fileName);
    return {
      message: 'File deleted successfully',
    };
  }
}
