import { PresignedUrl } from '@common/types/presigned-url';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

import { CreateFileDto } from '../dto/create-file.dto';
import { EffectiveFileDto } from '../dto/effective-file.dto';

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

// ============ ORGANIZATION FILE ENDPOINTS ============

export const ApiGetOrganizationFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de una organización',
      description:
        'Obtiene todos los archivos de una organización específica. Solo devuelve archivos del nivel organizacional.',
    }),
    ApiParam({
      name: 'orgId',
      description: 'ID de la organización',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de archivos organizacionales obtenida exitosamente (incluye información de herencia)',
      type: [EffectiveFileDto],
    }),
    ApiResponse({
      status: 404,
      description: 'Organización no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta organización',
    }),
  );

export const ApiUploadOrganizationFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Subir archivos a una organización',
      description:
        'Genera URLs firmadas para subir archivos al nivel organizacional. Estos archivos serán heredados por todos los proyectos y mandalas de la organización.',
    }),
    ApiParam({
      name: 'orgId',
      description: 'ID de la organización',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiBody({
      description: 'Lista de archivos organizacionales a subir',
      type: [CreateFileDto],
      examples: {
        politicas_org: {
          summary: 'Políticas organizacionales',
          value: [
            {
              file_name: 'politicas-generales.pdf',
              file_type: 'application/pdf',
            },
            {
              file_name: 'codigo-conducta.docx',
              file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'URLs firmadas para archivos organizacionales generadas exitosamente',
      type: [PresignedUrl],
    }),
    ApiResponse({
      status: 400,
      description: 'Solicitud incorrecta',
    }),
    ApiResponse({
      status: 404,
      description: 'Organización no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta organización',
    }),
  );

export const ApiDeleteOrganizationFile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar archivo de organización',
      description:
        'Elimina un archivo específico del nivel organizacional. Esto afectará la herencia en todos los proyectos y mandalas.',
    }),
    ApiParam({
      name: 'orgId',
      description: 'ID de la organización',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiParam({
      name: 'fileName',
      description: 'Nombre del archivo a eliminar',
      type: String,
      example: 'politicas-generales.pdf',
    }),
    ApiResponse({
      status: 200,
      description: 'Archivo organizacional eliminado exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Archivo o organización no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta organización',
    }),
  );

// ============ PROJECT FILE ENDPOINTS (WITH INHERITANCE) ============

export const ApiGetProjectFilesWithInheritance = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de proyecto con herencia',
      description:
        'Obtiene todos los archivos disponibles para un proyecto, incluyendo archivos heredados de la organización. Cada archivo incluye información sobre su origen (organización o proyecto).',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: '4bb0ea44-bae1-4a71-8d48-78d2d9de68f2',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de archivos con herencia obtenida exitosamente (incluye archivos de organización + proyecto)',
      type: [EffectiveFileDto],
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

export const ApiUploadProjectFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Subir archivos a un proyecto',
      description:
        'Genera URLs firmadas para subir archivos específicos del proyecto. Estos archivos serán heredados por todos los mandalas del proyecto.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: '4bb0ea44-bae1-4a71-8d48-78d2d9de68f2',
    }),
    ApiBody({
      description: 'Lista de archivos del proyecto a subir',
      type: [CreateFileDto],
      examples: {
        archivos_proyecto: {
          summary: 'Archivos específicos del proyecto',
          value: [
            {
              file_name: 'especificaciones-proyecto.docx',
              file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
            {
              file_name: 'cronograma.xlsx',
              file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'URLs firmadas para archivos del proyecto generadas exitosamente',
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

export const ApiDeleteProjectFile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar archivo específico del proyecto',
      description:
        'Elimina un archivo que pertenece específicamente al proyecto (no archivos heredados de la organización).',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: '4bb0ea44-bae1-4a71-8d48-78d2d9de68f2',
    }),
    ApiParam({
      name: 'fileName',
      description: 'Nombre del archivo a eliminar',
      type: String,
      example: 'especificaciones-proyecto.docx',
    }),
    ApiResponse({
      status: 200,
      description: 'Archivo del proyecto eliminado exitosamente',
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
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

// ============ MANDALA FILE ENDPOINTS (WITH FULL INHERITANCE) ============

export const ApiGetMandalaFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de mandala con herencia completa',
      description:
        'Obtiene todos los archivos disponibles para un mandala, incluyendo archivos heredados de la organización y del proyecto. Cada archivo incluye información sobre su origen (organización, proyecto o mandala).',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala',
      type: String,
      example: 'mandala-uuid-example',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de archivos con herencia completa obtenida exitosamente (incluye archivos de organización + proyecto + mandala)',
      type: [EffectiveFileDto],
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
  );

export const ApiUploadMandalaFiles = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Subir archivos específicos a un mandala',
      description:
        'Genera URLs firmadas para subir archivos específicos del mandala. Estos archivos solo estarán disponibles para este mandala en particular.',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala',
      type: String,
      example: 'mandala-uuid-example',
    }),
    ApiBody({
      description: 'Lista de archivos específicos del mandala a subir',
      type: [CreateFileDto],
      examples: {
        archivos_mandala: {
          summary: 'Archivos específicos del mandala',
          value: [
            {
              file_name: 'notas-mandala.txt',
              file_type: 'text/plain',
            },
            {
              file_name: 'referencias-visuales.jpg',
              file_type: 'image/jpeg',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'URLs firmadas para archivos del mandala generadas exitosamente',
      type: [PresignedUrl],
    }),
    ApiResponse({
      status: 400,
      description: 'Solicitud incorrecta',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
  );

export const ApiDeleteMandalaFile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar archivo específico del mandala',
      description:
        'Elimina un archivo que pertenece específicamente al mandala (no archivos heredados de organización o proyecto).',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala',
      type: String,
      example: 'mandala-uuid-example',
    }),
    ApiParam({
      name: 'fileName',
      description: 'Nombre del archivo a eliminar',
      type: String,
      example: 'notas-mandala.txt',
    }),
    ApiResponse({
      status: 200,
      description: 'Archivo del mandala eliminado exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Archivo o mandala no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
  );

// ============ BUFFER ENDPOINTS FOR AI SERVICE ============

export const ApiGetMandalaBuffers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener buffers de archivos para mandala (AI Service)',
      description:
        'Obtiene los buffers (contenido binario) de todos los archivos disponibles para un mandala, incluyendo herencia completa de organización y proyecto. Endpoint optimizado para el servicio de IA.',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala',
      type: String,
      example: 'mandala-uuid-example',
    }),
    ApiResponse({
      status: 200,
      description: 'Buffers de archivos con herencia completa obtenidos exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
              description: 'Contenido binario de archivos de org + proyecto + mandala',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
  );

export const ApiGetProjectBuffers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener buffers de archivos para proyecto (AI Service)',
      description:
        'Obtiene los buffers (contenido binario) de todos los archivos disponibles para un proyecto, incluyendo herencia de organización. Endpoint optimizado para el servicio de IA.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: '4bb0ea44-bae1-4a71-8d48-78d2d9de68f2',
    }),
    ApiResponse({
      status: 200,
      description: 'Buffers de archivos con herencia obtenidos exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
              description: 'Contenido binario de archivos de organización + proyecto',
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
