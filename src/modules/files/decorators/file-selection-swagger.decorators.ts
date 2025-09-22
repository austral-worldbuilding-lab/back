import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiUpdateOrganizationFileSelection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Actualizar selección de archivos de organización',
      description:
        'Actualiza el estado de selección (seleccionado/no seleccionado) de múltiples archivos a nivel organizacional. Permite operaciones batch para eficiencia.',
    }),
    ApiParam({
      name: 'orgId',
      description: 'ID de la organización',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiResponse({
      status: 200,
      description: 'Selecciones de archivos actualizadas exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'File selections updated successfully',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Organización o archivos no encontrados',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta organización',
    }),
  );

export const ApiGetOrganizationFilesWithSelection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de organización con estado de selección',
      description:
        'Obtiene todos los archivos de una organización junto con su estado de selección. Los archivos sin selección explícita aparecen como seleccionados por defecto.',
    }),
    ApiParam({
      name: 'orgId',
      description: 'ID de la organización',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de archivos con estado de selección obtenida exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file_name: { type: 'string', example: 'document.pdf' },
                file_type: { type: 'string', example: 'application/pdf' },
                source_scope: { type: 'string', example: 'org' },
                full_path: {
                  type: 'string',
                  example: 'org/805a5584.../files/document.pdf',
                },
                url: {
                  type: 'string',
                  example: 'https://storage.../document.pdf',
                },
                selected: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
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

export const ApiUpdateProjectFileSelection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Actualizar selección de archivos de proyecto',
      description:
        'Actualiza el estado de selección de múltiples archivos a nivel de proyecto.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiResponse({
      status: 200,
      description: 'Selecciones de archivos actualizadas exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'File selections updated successfully',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Proyecto o archivos no encontrados',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiGetProjectFilesWithSelection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de proyecto con estado de selección',
      description:
        'Obtiene todos los archivos disponibles para un proyecto (incluyendo herencia de organización) junto con su estado de selección.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      example: '805a5584-32de-4bdf-9f53-8b3ace7a21dc',
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de archivos con estado de selección obtenida exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file_name: { type: 'string', example: 'document.pdf' },
                file_type: { type: 'string', example: 'application/pdf' },
                source_scope: { type: 'string', example: 'project' },
                full_path: {
                  type: 'string',
                  example: 'org/805a5584.../project/files/document.pdf',
                },
                url: {
                  type: 'string',
                  example: 'https://storage.../document.pdf',
                },
                selected: { type: 'boolean', example: true },
              },
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

export const ApiUpdateMandalaFileSelection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Actualizar selección de archivos de mandala',
      description:
        'Actualiza el estado de selección de múltiples archivos a nivel de mandala específico.',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala',
      type: String,
      example: 'mandala-uuid-example',
    }),
    ApiResponse({
      status: 200,
      description: 'Selecciones de archivos actualizadas exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'File selections updated successfully',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala o archivos no encontrados',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
  );

export const ApiGetMandalaFilesWithSelection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener archivos de mandala con estado de selección',
      description:
        'Obtiene todos los archivos disponibles para un mandala (incluyendo herencia completa de organización y proyecto) junto con su estado de selección.',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala',
      type: String,
      example: 'mandala-uuid-example',
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de archivos con estado de selección obtenida exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file_name: { type: 'string', example: 'document.pdf' },
                file_type: { type: 'string', example: 'application/pdf' },
                source_scope: { type: 'string', example: 'mandala' },
                full_path: {
                  type: 'string',
                  example: 'org/805a5584.../project/mandala/files/document.pdf',
                },
                url: {
                  type: 'string',
                  example: 'https://storage.../document.pdf',
                },
                selected: { type: 'boolean', example: true },
              },
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
