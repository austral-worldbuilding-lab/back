import { Controller, Get, Post, Param, Body } from '@nestjs/common';
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
import { DataResponse } from '@common/types/responses';
import { PresignedUrl } from '@common/types/presigned-url';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';

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
    @Param('projectId', new UuidValidationPipe()) projectId: string,
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
    @Param('projectId', new UuidValidationPipe()) projectId: string,
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
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const response = await this.fileService.readAllFilesAsBuffers(projectId);
    return { data: response };
  }
}
