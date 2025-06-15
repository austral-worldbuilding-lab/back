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
    ApiResponse({ status: 400, description: 'Solicitud incorrecta' }),
    ApiResponse({ status: 401, description: 'Sin autorización' }),
  );

export const ApiGetAllProjects = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todos los proyectos con paginación' }),
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
    ApiResponse({ status: 401, description: 'Sin autorización' }),
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
    ApiResponse({ status: 401, description: 'Sin autorización' }),
    ApiResponse({
      status: 403,
      description: 'No tienes acceso a este proyecto',
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
    ApiResponse({ status: 401, description: 'Sin autorización' }),
    ApiResponse({
      status: 403,
      description: 'Solo el propietario puede actualizar proyectos',
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
    ApiResponse({ status: 401, description: 'Sin autorización' }),
    ApiResponse({
      status: 403,
      description: 'Solo el propietario puede eliminar proyectos',
    }),
  );

export const ApiGetProjectTags = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener tags de un proyecto específico' }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description: 'Retorna la lista de tags del proyecto',
      type: [TagDto],
    }),
    ApiResponse({ status: 404, description: 'Proyecto no encontrado' }),
    ApiResponse({ status: 401, description: 'Sin autorización' }),
    ApiResponse({
      status: 403,
      description: 'No tienes acceso a este proyecto',
    }),
  );
