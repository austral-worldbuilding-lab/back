import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ProjectUserDto } from '../dto/project-user.dto';
import { ProjectDto } from '../dto/project.dto';
import { TagDto } from '../dto/tag.dto';

export const ApiCreateProject = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo proyecto' }),
    ApiResponse({
      status: 201,
      description: 'El proyecto ha sido creado exitosamente',
      type: ProjectDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos suficientes',
    }),
  );

export const ApiGetAllProjects = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todos los proyectos' }),
    ApiQuery({
      name: 'page',
      description: 'Número de página',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Elementos por página',
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Retorna una lista paginada de proyectos',
      type: [ProjectDto],
    }),
  );

export const ApiGetProject = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener un proyecto por ID' }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description: 'Retorna el proyecto con el ID especificado',
      type: ProjectDto,
    }),
    ApiResponse({ status: 404, description: 'Proyecto no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiUpdateProject = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar un proyecto' }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description: 'El proyecto ha sido actualizado exitosamente',
      type: ProjectDto,
    }),
    ApiResponse({ status: 404, description: 'Proyecto no encontrado' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo el propietario puede actualizar el proyecto',
    }),
  );

export const ApiDeleteProject = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar un proyecto' }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description: 'El proyecto ha sido eliminado exitosamente',
      type: ProjectDto,
    }),
    ApiResponse({ status: 404, description: 'Proyecto no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - Solo el propietario puede eliminar el proyecto',
    }),
  );

export const ApiGetProjectTags = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todos los tags de un proyecto' }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description: 'Retorna una lista de tags del proyecto',
      type: [TagDto],
    }),
    ApiResponse({ status: 404, description: 'Proyecto no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiCreateProjectTag = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo tag para un proyecto' }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description: 'Tag creado exitosamente',
      type: TagDto,
    }),
    ApiResponse({ status: 400, description: 'Solicitud incorrecta' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiDeleteProjectTag = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar un tag de un proyecto' }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
    }),
    ApiParam({ name: 'tagId', description: 'ID del tag', type: String }),
    ApiResponse({
      status: 200,
      description: 'El tag ha sido eliminado exitosamente',
      type: TagDto,
    }),
    ApiResponse({ status: 404, description: 'Proyecto o tag no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - El usuario no tiene permiso para eliminar tags',
    }),
  );

export function ApiUpdateUserRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar rol de usuario en proyecto',
      description:
        'Permite a administradores y owners modificar el rol de un usuario en un proyecto específico',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'userId',
      description: 'ID del usuario cuyo rol se quiere modificar',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Rol de usuario actualizado exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Rol de usuario actualizado exitosamente',
          },
          data: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              projectId: { type: 'string' },
              role: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Datos de entrada inválidos',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'array',
            items: { type: 'string' },
            example: ['El rol debe ser uno de: owner, admin, member, viewer'],
          },
          error: { type: 'string', example: 'Bad Request' },
          statusCode: { type: 'number', example: 400 },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Unauthorized' },
          statusCode: { type: 'number', example: 401 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos para realizar esta acción',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'No tienes los permisos necesarios para realizar esta acción',
          },
          statusCode: { type: 'number', example: 403 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Usuario o proyecto no encontrado',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Usuario no encontrado en el proyecto',
          },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
  );
}

export const ApiGetProjectUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener todos los usuarios de un proyecto',
      description:
        'Retorna la lista de usuarios asociados al proyecto, incluyendo su rol',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios del proyecto obtenida exitosamente',
      type: [ProjectUserDto],
    }),
    ApiNotFoundResponse({
      description: 'Proyecto no encontrado',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Proyecto no encontrado' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos para acceder a este proyecto',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'No tienes acceso a este proyecto',
          },
          statusCode: { type: 'number', example: 403 },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Unauthorized' },
          statusCode: { type: 'number', example: 401 },
        },
      },
    }),
  );

export const ApiRemoveUserFromProject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar un usuario de un proyecto',
      description:
        'Elimina al usuario especificado del proyecto. Requiere permisos de administrador.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: 'string',
      format: 'uuid',
    }),
    ApiParam({
      name: 'userId',
      description: 'ID del usuario a eliminar del proyecto',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario eliminado del proyecto exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Usuario eliminado del proyecto exitosamente',
          },
          data: {
            $ref: '#/components/schemas/ProjectUserDto',
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Usuario o proyecto no encontrado',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Usuario no encontrado en el proyecto',
          },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos para realizar esta acción',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'No tienes los permisos necesarios para realizar esta acción',
          },
          statusCode: { type: 'number', example: 403 },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Unauthorized' },
          statusCode: { type: 'number', example: 401 },
        },
      },
    }),
  );
