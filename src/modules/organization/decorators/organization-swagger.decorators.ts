import { ProjectDto } from '@modules/project/dto/project.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { OrganizationUserRoleResponseDto } from '../dto/organization-user-role-response.dto';
import { OrganizationUserDto } from '../dto/organization-user.dto';
import { OrganizationDto } from '../dto/organization.dto';

export const ApiCreateOrganization = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear una nueva organización' }),
    ApiResponse({
      status: 201,
      description: 'La organización ha sido creada exitosamente',
      type: OrganizationDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos suficientes',
    }),
  );

export const ApiGetAllOrganizations = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todas las organizaciones' }),
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
      description: 'Retorna una lista paginada de organizaciones',
      type: [OrganizationDto],
    }),
  );

export const ApiGetOrganizationProjects = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener proyectos de una organización' }),
    ApiParam({
      name: 'id',
      description: 'ID de la organización',
      type: String,
    }),
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
      description: 'Retorna una lista paginada de proyectos de la organización',
      type: [ProjectDto],
    }),
    ApiResponse({ status: 404, description: 'Organización no encontrada' }),
  );

export const ApiGetOrganization = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener una organización por ID' }),
    ApiParam({
      name: 'id',
      description: 'ID de la organización',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Retorna la organización con el ID especificado',
      type: OrganizationDto,
    }),
    ApiResponse({ status: 404, description: 'Organización no encontrada' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta organización',
    }),
  );

export const ApiUpdateOrganization = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar una organización' }),
    ApiParam({
      name: 'id',
      description: 'ID de la organización',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'La organización ha sido actualizada exitosamente',
      type: OrganizationDto,
    }),
    ApiResponse({ status: 404, description: 'Organización no encontrada' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo el propietario puede actualizar la organización',
    }),
  );

export const ApiDeleteOrganization = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una organización' }),
    ApiParam({
      name: 'id',
      description: 'ID de la organización',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'La organización ha sido eliminada exitosamente',
      type: OrganizationDto,
    }),
    ApiResponse({ status: 404, description: 'Organización no encontrada' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo el propietario puede eliminar la organización',
    }),
  );

export const ApiGetOrganizationUsers = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener usuarios de una organización' }),
    ApiParam({
      name: 'organizationId',
      description: 'ID de la organización',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios de la organización',
      type: [OrganizationUserDto],
    }),
    ApiResponse({ status: 404, description: 'Organización no encontrada' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes permisos para ver los usuarios',
    }),
  );

export const ApiUpdateOrganizationUserRole = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar rol de usuario en organización' }),
    ApiParam({
      name: 'organizationId',
      description: 'ID de la organización',
      type: String,
    }),
    ApiParam({
      name: 'userId',
      description: 'ID del usuario',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Rol de usuario actualizado exitosamente',
      type: OrganizationUserRoleResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario u organización no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes permisos para cambiar roles',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflicto - No se puede degradar al último propietario',
    }),
  );

export const ApiRemoveUserFromOrganization = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar usuario de la organización' }),
    ApiParam({
      name: 'organizationId',
      description: 'ID de la organización',
      type: String,
    }),
    ApiParam({
      name: 'userId',
      description: 'ID del usuario',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario eliminado de la organización exitosamente',
      type: OrganizationUserDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario u organización no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes permisos para eliminar usuarios',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflicto - No se puede eliminar al último propietario',
    }),
  );

export const ApiUploadOrganizationContext = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Subir contenido de texto como archivo de contexto',
    }),
    ApiParam({
      name: 'id',
      description: 'ID de la organización',
      type: String,
    }),
    ApiResponse({
      status: 201,
      description: 'Archivo de contexto subido exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL pública del archivo subido',
                example:
                  'https://storage.blob.core.windows.net/container/org-id/files/context.txt',
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
      description:
        'Prohibido - No tiene permisos para subir contextos en esta organización',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Token de acceso requerido',
    }),
  );
