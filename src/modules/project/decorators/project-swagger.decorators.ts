import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

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
