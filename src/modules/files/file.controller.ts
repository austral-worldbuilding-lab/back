import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FileService } from './file.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateFileDto } from './dto/create-file.dto';
import { DataResponse, MessageResponse } from '@common/types/responses';
import { PresignedUrl } from '@common/types/presigned-url';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { ProjectParticipantGuard } from '@modules/mandala/guards/project-participant.guard';

@ApiTags('Files')
@Controller('files')
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':projectId')
  @ApiOperation({
    summary: 'Obtener archivos de un proyecto',
    description:
      'Obtiene la lista de todos los archivos asociados a un proyecto específico',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    type: String,
    example: 'project_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos obtenida exitosamente',
    type: [CreateFileDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Sin autorización',
  })
  async getFiles(
    @Param('projectId') projectId: string,
  ): Promise<DataResponse<CreateFileDto[]>> {
    const response = await this.fileService.getFiles(projectId);
    return { data: response };
  }

  @Post(':projectId')
  @ApiOperation({
    summary: 'Subir archivos a un proyecto',
    description:
      'Genera URLs firmadas para subir archivos a un proyecto específico',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    type: String,
    example: 'project_123',
  })
  @ApiBody({
    description: 'Lista de archivos a subir',
    type: [CreateFileDto],
    examples: {
      archivo_pdf: {
        summary: 'Ejemplo con archivo PDF',
        value: [
          {
            file_name: 'documento.pdf',
            file_type: 'application/pdf',
          },
        ],
      },
      multiples_archivos: {
        summary: 'Ejemplo con múltiples archivos',
        value: [
          {
            file_name: 'imagen.jpg',
            file_type: 'image/jpeg',
          },
          {
            file_name: 'texto.txt',
            file_type: 'text/plain',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'URLs firmadas generadas exitosamente',
    type: [PresignedUrl],
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Sin autorización',
  })
  async uploadFiles(
    @Param('projectId') projectId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const response = await this.fileService.uploadFiles(body, projectId);
    return { data: response };
  }

  @Get(':projectId/buffers')
  @ApiOperation({
    summary: 'Obtener buffers de archivos',
    description:
      'Obtiene los buffers (contenido binario) de todos los archivos de un proyecto',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    type: String,
    example: 'project_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Buffers de archivos obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
            description: 'Contenido binario del archivo',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Sin autorización',
  })
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
