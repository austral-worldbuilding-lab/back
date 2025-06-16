import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MandalaDto } from '../dto/mandala.dto';
import { FilterSectionDto } from '../dto/filter-option.dto';
import { MandalaWithPostitsAndLinkedCentersDto } from '../dto/mandala-with-postits-and-linked-centers.dto';

export const ApiCreateMandala = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo mandala' }),
    ApiResponse({
      status: 201,
      description: 'El mandala ha sido creado exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos suficientes',
    }),
  );

export const ApiGetAllMandalas = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener todos los mandalas de un proyecto' }),
    ApiQuery({
      name: 'projectId',
      required: true,
      description: 'ID del proyecto',
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
      description: 'Retorna una lista paginada de mandalas',
      type: [MandalaDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiGetMandalaFilters = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener filtros configurables para un mandala',
      description:
        'Retorna todas las opciones de filtros disponibles para construir dinámicamente un menú de selección (dimensiones, escalas y tags) basado en el mandala especificado',
    }),
    ApiQuery({
      name: 'id',
      required: true,
      description:
        'ID del mandala para obtener dimensiones, escalas y tags del proyecto asociado',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Retorna las secciones de filtros configurables',
      type: [FilterSectionDto],
    }),
    ApiResponse({ status: 404, description: 'Mandala no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'No tienes acceso al proyecto del mandala',
    }),
  );

export const ApiGetMandala = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener un mandala por ID' }),
    ApiParam({ name: 'id', description: 'ID del mandala', type: String }),
    ApiResponse({
      status: 200,
      description: 'Retorna el mandala con el ID especificado',
      type: MandalaDto,
    }),
    ApiResponse({ status: 404, description: 'Mandala no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiUpdateMandala = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar un mandala' }),
    ApiParam({ name: 'id', description: 'ID del mandala', type: String }),
    ApiResponse({
      status: 200,
      description: 'El mandala ha sido actualizado exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({ status: 404, description: 'Mandala no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiDeleteMandala = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar un mandala' }),
    ApiParam({ name: 'id', description: 'ID del mandala', type: String }),
    ApiResponse({
      status: 200,
      description: 'El mandala ha sido eliminado exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({ status: 404, description: 'Mandala no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - Solo el propietario del proyecto puede eliminar mandalas',
    }),
  );

export const ApiGenerateMandala = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar un mandala automáticamente con IA',
      description:
        'Crea un nuevo mandala con post-its generados automáticamente usando ia.',
    }),
    ApiResponse({
      status: 201,
      description: 'Se generó un nuevo mandala automáticamente con sus post-its',
      type: MandalaWithPostitsAndLinkedCentersDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );
