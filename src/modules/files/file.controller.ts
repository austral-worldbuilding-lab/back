import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { FileService } from './file.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateFileDto } from './dto/create-file.dto';
import { DataResponse, MessageResponse } from '@common/types/responses';
import { PresignedUrl } from '@common/types/presigned-url';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { ProjectParticipantGuard } from '@modules/mandala/guards/project-participant.guard';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { FileRoleGuard } from './guards/file-role.guard';
import {
  ApiGetFiles,
  ApiUploadFiles,
  ApiGetFileBuffers,
} from './decorators/file-swagger.decorators';

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
    @Param('projectId') projectId: string,
  ): Promise<DataResponse<CreateFileDto[]>> {
    const response = await this.fileService.getFiles(projectId);
    return { data: response };
  }

  @Post(':projectId')
  @UseGuards(FileRoleGuard)
  @ApiUploadFiles()
  async uploadFiles(
    @Param('projectId') projectId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const response = await this.fileService.uploadFiles(body, projectId);
    return { data: response };
  }

  @Get(':projectId/buffers')
  @UseGuards(FileRoleGuard)
  @ApiGetFileBuffers()
  async getFileBuffers(
    @Param('projectId') projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const response = await this.fileService.readAllFilesAsBuffers(projectId);
    return { data: response };
  }

  @Delete(':projectId/:filename')
  @UseGuards(FirebaseAuthGuard, ProjectParticipantGuard)
  @ApiOperation({
    summary: 'Eliminar un archivo de un proyecto',
    description:
      'Elimina un archivo específico almacenado en Azure Blob para un proyecto',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    type: String,
    example: 'project_123',
  })
  @ApiParam({
    name: 'filename',
    description: 'Nombre del archivo a eliminar',
    type: String,
    example: 'documento.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Archivo o proyecto no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Sin autorización',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No pertenece al proyecto',
  })
  async deleteFile(
    @Param('projectId') projectId: string,
    @Param('filename') filename: string,
  ): Promise<MessageResponse<null>> {
    await this.fileService.deleteFile(projectId, filename);
    return {
      message: 'File deleted successfully',
      data: null,
    };
  }
}
