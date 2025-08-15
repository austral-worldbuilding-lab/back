import { ProjectDto } from '@modules/project/dto/project.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

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
