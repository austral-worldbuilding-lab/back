import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { UserStatsDto } from '../dto/user-stats.dto';
import { UserDto } from '../dto/user.dto';

export const ApiCreateUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo usuario' }),
    ApiResponse({
      status: 201,
      description: 'El usuario fue creado exitosamente.',
      type: UserDto,
    }),
    ApiResponse({ status: 400, description: 'Solicitud incorrecta.' }),
  );

export const ApiGetAllUsers = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todos los usuarios con paginación' }),
    ApiQuery({
      name: 'page',
      description: 'Numero de pagina',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Items por pagina',
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Devuelve una lista paginada de usuarios',
      type: [UserDto],
    }),
    ApiResponse({ status: 401, description: 'Sin autorización.' }),
  );

export const ApiGetUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener un usuario por ID' }),
    ApiParam({ name: 'id', description: 'User ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'Devuelve el usuario con el ID especifico',
      type: UserDto,
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado.' }),
    ApiResponse({ status: 401, description: 'Sin autorización.' }),
  );

export const ApiUpdateUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar usuario' }),
    ApiParam({ name: 'id', description: 'User ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'El usuario ha sido actualizado correctamente.',
      type: UserDto,
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
    ApiResponse({ status: 401, description: 'Sin autorización.' }),
    ApiResponse({
      status: 403,
      description: 'Solo puedes modificar tu propio perfil.',
    }),
  );

export const ApiDeleteUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Desactivar usuario' }),
    ApiParam({ name: 'id', description: 'User ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'El usuario fue desactivado exitosamente',
      type: UserDto,
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado.' }),
    ApiResponse({ status: 401, description: 'Sin autorización.' }),
    ApiResponse({
      status: 403,
      description: 'Solo puedes desactivar tu propio perfil.',
    }),
  );

export const ApiGetCurrentUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener el usuario autenticado (me)' }),
    ApiResponse({
      status: 200,
      description: 'Devuelve el usuario autenticado',
      type: UserDto,
    }),
    ApiResponse({ status: 401, description: 'Sin autorización.' }),
  );

export const ApiGetUserStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener estadísticas del usuario autenticado',
      description:
        'Devuelve estadísticas del usuario: cantidad de organizaciones (creadas e invitadas), mundos/proyectos creados (incluye subproyectos y proyectos de provocaciones), total de mandalas y soluciones generadas',
    }),
    ApiResponse({
      status: 200,
      description: 'Devuelve las estadísticas del usuario',
      type: UserStatsDto,
    }),
    ApiResponse({ status: 401, description: 'Sin autorización.' }),
  );
