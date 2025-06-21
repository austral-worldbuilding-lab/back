import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MandalaDto } from '../dto/mandala.dto';
import { FilterSectionDto } from '../dto/filter-option.dto';
import { MandalaWithPostitsAndLinkedCentersDto } from '../dto/mandala-with-postits-and-linked-centers.dto';
import { CharacterListItemDto } from '../dto/character-list-item.dto';

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
      description:
        'Prohibido - Solo el propietario del proyecto puede eliminar mandalas',
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
      description:
        'Se generó un nuevo mandala automáticamente con sus post-its',
      type: MandalaWithPostitsAndLinkedCentersDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiLinkMandala = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Vincular un mandala como hijo de otro mandala',
      description:
        'Establece una relación padre-hijo entre dos mandalas existentes. Ambos mandalas deben pertenecer al mismo proyecto.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del mandala padre',
      type: String,
    }),
    ApiParam({
      name: 'childId',
      description: 'ID del mandala hijo a vincular',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'La mandala ha sido vinculado exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Solicitud inválida - Las mandalas pertenecen a proyectos diferentes',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala padre o hijo no encontrada',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiUnlinkMandala = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Desvincular un mandala hijo de su mandala padre',
      description:
        'Elimina la relación padre-hijo entre dos mandalas. El mandala hijo seguirá existiendo independientemente.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID de la mandala padre',
      type: String,
    }),
    ApiParam({
      name: 'childId',
      description: 'ID de la mandala hijo a desvincular',
      type: String,
    }),
    ApiResponse({
      status: 204,
      description: 'La mandala ha sido desvinculado exitosamente',
    }),
    ApiResponse({
      status: 400,
      description:
        'Solicitud inválida - No existe relación entre esta mandala y la mandala padre',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala padre o hijo no encontrado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiGetAvailableCharacters = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener personajes disponibles para vincular a un mandala',
      description:
        'Retorna una lista de todos los mandalas en el mismo proyecto que no son el mandala actual y que aún no están vinculados como hijos directos. Estos mandalas pueden ser seleccionados para convertirse en personajes (hijos) del mandala especificado.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del mandala para el cual se buscan personajes',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de mandalas disponibles para ser vinculados como personajes',
      type: [CharacterListItemDto],
    }),
    ApiResponse({ status: 404, description: 'Mandala no encontrado' }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );
