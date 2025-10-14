import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { AiQuestionResponseDto } from '../dto/ai-question-response.dto';
import { CharacterListItemDto } from '../dto/character-list-item.dto';
import { FilterSectionDto } from '../dto/filter-option.dto';
import { ImageResponseDto } from '../dto/image/image-response.dto';
import { PresignedUrlResponseDto } from '../dto/image/presigned-url-response.dto';
import { MandalaWithPostitsAndLinkedCentersDto } from '../dto/mandala-with-postits-and-linked-centers.dto';
import { MandalaDto } from '../dto/mandala.dto';
import { PostitResponseDto } from '../dto/postit/postit-response.dto';
import { PostitWithCoordinatesDto } from '../dto/postit/postit-with-coordinates.dto';

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

export const ApiCreateContextMandala = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear un nuevo mandala de contexto',
      description:
        'Crea un nuevo mandala de tipo CONTEXT para observaciones generales del mundo sin vinculación a personajes específicos.',
    }),
    ApiResponse({
      status: 201,
      description: 'El mandala de contexto ha sido creado exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tiene permisos suficientes',
    }),
  );

export const ApiGenerateContextMandala = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar un mandala de contexto automáticamente con IA',
      description:
        'Crea un nuevo mandala de tipo CONTEXT con post-its generados automáticamente que representan aspectos generales del mundo usando IA.',
    }),
    ApiResponse({
      status: 201,
      description:
        'Se generó un nuevo mandala de contexto automáticamente con sus post-its',
      type: MandalaWithPostitsAndLinkedCentersDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
  );

export const ApiCreatePostit = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear un nuevo post-it en un mandala',
      description:
        'Crea un nuevo post-it en el mandala especificado con coordenadas, dimensiones, sección y tags. Si se proporciona imageFileName, también genera una URL firmada para subir la imagen.',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala donde se creará el post-it',
      type: String,
    }),
    ApiResponse({
      status: 201,
      description:
        'El post-it ha sido creado exitosamente. Incluye URL firmada si se proporcionó imageFileName.',
      type: PostitResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
  );

export const ApiDeletePostit = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar un post-it y todos sus hijos',
      description:
        'Elimina un post-it y recursivamente todos sus post-its hijos del mandala',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala donde se encuentra el post-it',
      type: String,
    }),
    ApiParam({
      name: 'postitId',
      description: 'ID del post-it a eliminar',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'El post-it y sus hijos han sido eliminados exitosamente',
      type: [PostitResponseDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala o post-it no encontrado',
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

export const ApiUpdatePostit = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Actualizar un post-it existente',
      description:
        'Actualiza el contenido y tags de un post-it existente. ' +
        'Este endpoint se utiliza exclusivamente cuando se abre el modal de edición de un post-it. ' +
        'Su propósito principal es permitir la modificación de los tags, aunque también se permite actualizar el texto. ' +
        'Sin embargo, la lógica de modificación del texto del post-it continúa siendo responsabilidad del frontend. ',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID del mandala donde se encuentra el post-it',
      type: String,
    }),
    ApiParam({
      name: 'postitId',
      description: 'ID del post-it a actualizar',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'El post-it ha sido actualizado exitosamente',
      type: PostitResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado - Usuario no autenticado',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala o post-it no encontrado',
    }),
  );

export const ApiGenerateQuestions = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar preguntas usando IA',
      description:
        'Genera preguntas guía para un mandala usando IA basándose en la configuración del mandala y archivos del proyecto',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del mandala para generar preguntas',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Preguntas generadas exitosamente',
      type: [AiQuestionResponseDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
  );

export const ApiGeneratePostits = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar post-its usando IA',
      description:
        'Genera post-its para un mandala usando IA basándose en la configuración del mandala y archivos del proyecto',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del mandala para generar post-its',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Post-its generados exitosamente',
      type: [PostitWithCoordinatesDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
  );

export const ApiOverlapMandalas = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Unir mandalas',
      description:
        'Crea una nueva mandala que es la unión de dos o más mandalas existentes, incluyendo todos sus post-its. ' +
        'Todas las mandalas deben tener las mismas dimensiones y escalas para poder ser superpuestas. ' +
        'La nueva mandala se guardará en el proyecto de la primera mandala de la lista, ' +
        'permitiendo superponer mandalas de diferentes proyectos. ' +
        'El centro de la nueva mandala contendrá todos los personajes centrales originales. ' +
        'Todos los post-its serán copiados a la nueva mandala.',
    }),
    ApiResponse({
      status: 200,
      description: 'Mandala unida creada exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Solicitud inválida - Las mandalas deben tener las mismas dimensiones y escalas',
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a uno o más proyectos',
    }),
    ApiResponse({
      status: 404,
      description: 'Una o más mandalas no encontradas',
    }),
  );

export const ApiGetCachedQuestions = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener preguntas del cache',
      description:
        'Obtiene todas las preguntas generadas previamente para un mandala desde el cache',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del mandala',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Preguntas obtenidas exitosamente del cache',
      type: [AiQuestionResponseDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
  );

export const ApiGetCachedPostits = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener post-its del cache',
      description:
        'Obtiene todos los post-its generados previamente para un mandala desde el cache',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del mandala',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Post-its obtenidos exitosamente del cache',
      type: [PostitWithCoordinatesDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrado',
    }),
  );

export const ApiOverlapSummary = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Comparar mandalas',
      description: 'Compara dos mandalas usando IA',
    }),
    ApiResponse({
      status: 200,
      description: 'Mandala superpuesto de comparación creado exitosamente',
      type: MandalaDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Solicitud inválida - Las mandalas deben tener las mismas dimensiones y escalas',
    }),
  );

export const ApiCreateImagePresignedUrl = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar URL firmada para subir imagen',
      description:
        'Genera una URL firmada para que el frontend pueda subir una imagen directamente a S3',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID de la mandala',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'URL firmada generada exitosamente',
      type: PresignedUrlResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrada',
    }),
  );

export const ApiConfirmImageUpload = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Confirmar carga de imagen',
      description:
        'Confirma que la imagen fue subida exitosamente usando solo el imageId. Construye la URL automáticamente y crea la imagen en la mandala en el centro (0,0) con valores por defecto',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID de la mandala',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Imagen confirmada y guardada exitosamente',
      type: ImageResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala no encontrada',
    }),
  );

export const ApiDeleteImage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar imagen de mandala',
      description: 'Elimina una imagen de la mandala y del almacenamiento S3',
    }),
    ApiParam({
      name: 'mandalaId',
      description: 'ID de la mandala',
      type: String,
    }),
    ApiParam({
      name: 'imageId',
      description: 'ID de la imagen a eliminar',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Imagen eliminada exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Image deleted successfully' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a esta mandala',
    }),
    ApiResponse({
      status: 404,
      description: 'Mandala o imagen no encontrada',
    }),
  );
