import { PresignedUrl } from '@common/types/presigned-url';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

import { CreateFileDto } from '../dto/create-file.dto';

export const ApiGetFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de un proyecto',
      description:
        'Obtiene la lista de todos los archivos asociados a un proyecto específico',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: 'project_123',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de archivos obtenida exitosamente',
      type: [CreateFileDto],
    }),
    ApiResponse({
      status: 404,
      description: 'Proyecto no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiUploadFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Subir archivos a un proyecto',
      description:
        'Genera URLs firmadas para subir archivos a un proyecto específico',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: 'project_123',
    }),
    ApiBody({
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
    }),
    ApiResponse({
      status: 201,
      description: 'URLs firmadas generadas exitosamente',
      type: [PresignedUrl],
    }),
    ApiResponse({
      status: 400,
      description: 'Solicitud incorrecta',
    }),
    ApiResponse({
      status: 404,
      description: 'Proyecto no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiGetFileBuffers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener buffers de archivos',
      description:
        'Obtiene los buffers (contenido binario) de todos los archivos de un proyecto',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: 'project_123',
    }),
    ApiResponse({
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
    }),
    ApiResponse({
      status: 404,
      description: 'Proyecto no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiDeleteFile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar un archivo de un proyecto',
      description:
        'Elimina un archivo específico almacenado en Azure Blob para un proyecto',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: 'project_123',
    }),
    ApiParam({
      name: 'fileName',
      description: 'Nombre del archivo a eliminar',
      type: String,
      example: 'documento.pdf',
    }),
    ApiResponse({
      status: 200,
      description: 'Archivo eliminado exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Archivo o proyecto no encontrado',
    }),
    ApiResponse({ status: 401, description: 'Sin autorización' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );
