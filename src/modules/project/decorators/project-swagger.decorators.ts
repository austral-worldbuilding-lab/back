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
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';

import { AiProvocationResponseDto } from '../dto/ai-provocation-response.dto';
import { ProjectUserDto } from '../dto/project-user.dto';
import { ProjectDto } from '../dto/project.dto';
import { ProvocationDto } from '../dto/provocation.dto';
import { TagDto } from '../dto/tag.dto';
import { TimelineGraphDto } from '../dto/timeline.dto';
import { ProjectConfiguration } from '../types/project-configuration.type';

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
    ApiQuery({
      name: 'rootOnly',
      description:
        'Si es true, retorna solo proyectos raíz (rootProjectId = id)',
      type: Boolean,
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

export const ApiGetProjectConfiguration = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener la configuración de un proyecto',
      description:
        'Retorna las dimensiones y escalas configuradas para el proyecto especificado',
    }),
    ApiParam({ name: 'id', description: 'ID del proyecto', type: String }),
    ApiResponse({
      status: 200,
      description:
        'Retorna la configuración del proyecto (dimensiones y escalas)',
      type: ProjectConfiguration,
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
    ApiBody({
      description: 'Datos para actualizar el proyecto',
      examples: {
        'actualizar-nombre': {
          summary: 'Actualizar solo el nombre',
          description: 'Ejemplo de actualización del nombre del proyecto',
          value: {
            name: 'Proyecto Comedor Austral Actualizado',
          },
        },
        'actualizar-descripcion': {
          summary: 'Actualizar solo la descripción',
          description:
            'Ejemplo de actualización de la descripción del proyecto',
          value: {
            description:
              'Esta es una descripción actualizada del proyecto que busca mejorar la experiencia del comedor universitario.',
          },
        },
        'actualizar-completo': {
          summary: 'Actualización completa',
          description:
            'Ejemplo de actualización de múltiples campos del proyecto',
          value: {
            name: 'Proyecto Comedor Austral Mejorado',
            description:
              'Este proyecto busca mejorar significativamente la experiencia del comedor universitario mediante el análisis profundo de las necesidades de los usuarios y la implementación de mejoras innovadoras.',
            dimensions: [
              { name: 'Recursos', color: '#FF0000' },
              { name: 'Tiempo', color: '#00FF00' },
              { name: 'Calidad', color: '#0000FF' },
            ],
            scales: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
          },
        },
      },
    }),
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

export const ApiGenerateProjectProvocations = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar provocaciones para un proyecto',
      description:
        'Genera provocaciones con IA basadas en las mandalas y archivos y descripción del proyecto',
    }),
    ApiParam({
      name: 'id',
      description: 'ID único del proyecto',
      type: String,
      example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    }),
    ApiResponse({
      status: 200,
      description: 'Provocaciones generadas exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  example: 'Crear un Festejódromo',
                },
                description: {
                  type: 'string',
                  example:
                    'Se propone la creación de un espacio dedicado dentro del campus universitario para la celebración de festejos de graduación. Este "Festejódromo" contaría con una infraestructura específica que facilitaría la limpieza inmediata, promovería la donación de alimentos sobrantes para fomentar festejos solidarios y sostenibles, y ofrecería mensajes inspiradores sobre una nueva etapa para los graduados. Aborda la problemática de la huella ecológica y el mal prestigio al centralizar y regular las celebraciones, y satisface el deseo de los alumnos de festejar dentro del campus con sus seres queridos, gestionando las preocupaciones de seguridad y orden con la comunidad local.',
                },
                question: {
                  type: 'string',
                  example:
                    '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
                },
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Solicitud incorrecta - El proyecto no cumple con los requisitos mínimos para generar provocaciones',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            examples: {
              missingDescription: {
                summary: 'Falta descripción del proyecto',
                value:
                  'Se requiere una descripción del proyecto para generar provocaciones.',
              },
              missingDimensions: {
                summary: 'Faltan dimensiones del proyecto',
                value:
                  'Se requieren dimensiones del proyecto para generar provocaciones.',
              },
              missingScales: {
                summary: 'Faltan escalas del proyecto',
                value:
                  'Se requieren escalas del proyecto para generar provocaciones.',
              },
              insufficientMandalas: {
                summary: 'Insuficientes mandalas',
                value:
                  'El proyecto no cumple el minimo de mandalas para generar provocaciones.',
              },
              insufficientPostits: {
                summary: 'Insuficientes postits',
                value:
                  'El proyecto no cumple el minimo de postits en todas las mandalas para generar provocaciones.',
              },
              insufficientFiles: {
                summary: 'Insuficientes archivos',
                value:
                  'El proyecto no cumple el minimo de archivos para generar provocaciones.',
              },
            },
          },
          error: { type: 'string', example: 'Solicitud Incorrecta' },
          statusCode: { type: 'number', example: 400 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Proyecto no encontrado',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'Project with id a1b2c3d4-e5f6-7890-1234-567890abcdef not found',
          },
          error: { type: 'string', example: 'Not Found' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Prohibido - No tiene permisos para acceder a este proyecto',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Forbidden resource' },
          error: { type: 'string', example: 'Forbidden' },
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

export const ApiGetCachedProvocations = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener provocaciones del cache',
      description:
        'Obtiene todas las provocaciones generadas previamente para un proyecto desde el cache',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del proyecto',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Provocaciones obtenidas exitosamente del cache',
      type: [AiProvocationResponseDto],
    }),
    ApiResponse({
      status: 403,
      description: 'Prohibido - No tienes acceso a este proyecto',
    }),
    ApiResponse({
      status: 404,
      description: 'Proyecto no encontrado',
    }),
  );

export const ApiFindAllProvocations = () =>
  applyDecorators(
    ApiExtraModels(ProvocationDto),
    ApiOperation({
      summary: 'Obtener provocaciones generadas por un proyecto',
      description:
        'Retorna una lista de todas las provocaciones que fueron generadas por el proyecto especificado (rol GENERATED). Solo incluye los datos básicos de cada provocación, sin relaciones padre/hijo.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    }),
    ApiResponse({
      status: 200,
      description:
        'Lista de provocaciones generadas por el proyecto obtenida exitosamente',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ProvocationDto',
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Proyecto no encontrado',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'Project with ID "a1b2c3d4-e5f6-7890-1234-567890abcdef" not found',
          },
          error: { type: 'string', example: 'Not Found' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Prohibido - No tiene permisos para acceder al proyecto',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
  );

export const ApiCreateProvocation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear una nueva provocación para un proyecto',
      description:
        'Crea una nueva provocación asociada al proyecto especificado. La provocación se vincula automáticamente con el proyecto con rol GENERATED.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    }),
    ApiResponse({
      status: 201,
      description: 'Provocación creada exitosamente',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Provocation created successfully',
          },
          data: {
            $ref: '#/components/schemas/ProvocationDto',
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
            example: [
              'question should not be empty',
              'question must be a string',
            ],
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
      description: 'Proyecto no encontrado',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'Project with id a1b2c3d4-e5f6-7890-1234-567890abcdef not found',
          },
          error: { type: 'string', example: 'Not Found' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
  );

export const ApiCreateProjectFromProvocationId = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear proyecto desde provocación',
      description:
        'Crea un nuevo proyecto usando los datos de una provocación existente. Si la provocación fue generada por un proyecto padre, el nombre será "{Padre}: {Provocación}" y se heredarán las configuraciones. Si no hay proyecto padre, se debe proporcionar un nombre y se usarán configuraciones por defecto.',
    }),
    ApiBody({
      description: 'Datos para crear el proyecto desde una provocación',
      examples: {
        'con-proyecto-padre': {
          summary: 'Proyecto con padre (hereda configuraciones)',
          description:
            'Cuando la provocación fue generada por un proyecto padre.',
          value: {
            fromProvocationId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            organizationId: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
          },
        },
        'sin-proyecto-padre': {
          summary: 'Proyecto sin padre',
          description:
            'Cuando la provocación no fue generada por ningún proyecto.',
          value: {
            fromProvocationId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            organizationId: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
            name: 'Proyecto Comedor Austral',
            dimensions: [{ name: 'Recursos', color: '#FF0000' }],
            scales: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Proyecto creado exitosamente desde la provocación',
      type: ProjectDto,
    }),
    ApiBadRequestResponse({
      description:
        'Datos inválidos: nombre requerido cuando no hay proyecto padre, organización no coincide con proyecto padre, o configuraciones no coinciden',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            examples: [
              'Project name is required when the provocation was not generated by any project.',
              "Organization ID must match parent project's organization (uuid) or be omitted to inherit it.",
              'Dimensions must match parent project dimensions or be omitted to inherit them.',
            ],
          },
          error: { type: 'string', example: 'Bad Request' },
          statusCode: { type: 'number', example: 400 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Provocación no encontrada',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'Provocation with ID "a1b2c3d4-e5f6-7890-1234-567890abcdef" not found',
          },
          error: { type: 'string', example: 'Not Found' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
    ApiForbiddenResponse({
      description:
        'Prohibido - No tiene permisos suficientes en la organización',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
  );

export const ApiCreateProjectFromProvocation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear proyecto desde **una nueva** provocación',
      description:
        'Crea un nuevo proyecto a partir de **una nueva** provocacion. Si al proyecto no se le pasa un nombre y una descripción explícitas, estos serán la pregunta de la nueva provocacion.',
    }),
    ApiBody({
      description:
        'Datos para crear el proyecto desde una nueva provocación basada en una pregunta',
      examples: {
        'con-nombre-y-descripcion-explicitos': {
          summary: 'Proyecto con nombre y descripción personalizados',
          description:
            'Crear un proyecto con un nombre y descripción específicos basado en una pregunta.',
          value: {
            question:
              '¿Cómo podemos mejorar la experiencia del comedor universitario?',
            organizationId: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
            name: 'Proyecto Comedor Austral',
            description:
              'Este proyecto busca crear un espacio dedicado para mejorar la experiencia del comedor universitario, promoviendo la convivencia y el sentido de comunidad entre los estudiantes.',
            dimensions: [{ name: 'Recursos', color: '#FF0000' }],
            scales: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
          },
        },
        'solo-con-pregunta': {
          summary: 'Proyecto usando solo la pregunta (usa defaults)',
          description:
            'El nombre y descripción del proyecto serán automáticamente la pregunta proporcionada, y se usarán dimensiones y escalas por defecto.',
          value: {
            question:
              '¿Cómo podemos reducir el desperdicio de alimentos en el campus?',
            organizationId: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
          },
        },
        'con-configuracion-personalizada': {
          summary: 'Proyecto con configuración personalizada',
          description:
            'Usar la pregunta como nombre y descripción, pero con dimensiones y escalas personalizadas.',
          value: {
            question:
              '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
            organizationId: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
            dimensions: [
              { name: 'Sostenibilidad', color: '#00FF00' },
              { name: 'Comunidad', color: '#0000FF' },
            ],
            scales: ['Individual', 'Comunidad', 'Institución', 'Universidad'],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Proyecto creado exitosamente desde una nueva provocación',
      type: ProjectDto,
    }),
    ApiBadRequestResponse({
      description: 'Datos de entrada inválidos',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'array',
            items: { type: 'string' },
            examples: [
              ['Question is required'],
              ['question should not be empty', 'question must be a string'],
              [
                'organizationId must be a UUID',
                'organizationId should not be empty',
              ],
              ['name must be a string'],
              ['description must be a string'],
              [
                'dimensions must be an array',
                'each value in dimensions must be a valid object',
              ],
              [
                'scales must be an array',
                'each value in scales must be a string',
              ],
            ],
          },
          error: { type: 'string', example: 'Bad Request' },
          statusCode: { type: 'number', example: 400 },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Organización no encontrada',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Organization not found',
          },
          error: { type: 'string', example: 'Not Found' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    }),
    ApiForbiddenResponse({
      description:
        'Prohibido - No tiene permisos suficientes en la organización',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
  );

export const ApiGetProjectTimeline = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener timeline de proyecto',
      description:
        'Obtiene el grafo completo de proyectos ordenado cronológicamente',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del proyecto',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Timeline obtenido exitosamente',
      type: TimelineGraphDto,
    }),
    ApiNotFoundResponse({
      description: 'Proyecto no encontrado',
    }),
    ApiForbiddenResponse({
      description: 'Prohibido - No tiene permisos para acceder a este proyecto',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
  );

export const ApiGenerateProjectEncyclopedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Generar enciclopedia del proyecto usando IA (async)',
      description:
        'Inicia un job asíncrono para generar una enciclopedia comprehensiva del mundo del proyecto usando IA basada en todos los resúmenes de mandalas. Retorna un job ID para consultar el estado.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto para generar la enciclopedia',
      type: String,
      format: 'uuid',
    }),
    ApiResponse({
      status: 202,
      description:
        'Job de generación de enciclopedia iniciado exitosamente. Use el jobId para consultar el estado.',
      schema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'ID del job para consultar el estado',
            example:
              'encyclopedia-a1b2c3d4-e5f6-7890-1234-567890abcdef-1697234567890',
          },
          message: {
            type: 'string',
            example: 'Encyclopedia generation job has been queued',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Solicitud incorrecta - Ya existe un job de enciclopedia en progreso para este proyecto',
    }),
    ApiNotFoundResponse({
      description: 'Proyecto no encontrado',
    }),
    ApiForbiddenResponse({
      description: 'Prohibido - No tiene permisos para acceder a este proyecto',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
    ApiResponse({
      status: 429,
      description:
        'Demasiadas peticiones - límite de throttling alcanzado (10 requests/hora)',
    }),
  );

export const ApiGetEncyclopediaJobStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener estado del job de enciclopedia del proyecto',
      description:
        'Consulta el estado del job activo de generación de enciclopedia para el proyecto. Retorna el estado actual y el resultado si está completado. Solo puede haber un job activo por proyecto.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID del proyecto',
      type: String,
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Estado del job obtenido exitosamente',
      schema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            example:
              'encyclopedia-a1b2c3d4-e5f6-7890-1234-567890abcdef-1697234567890',
          },
          status: {
            type: 'string',
            enum: [
              'none',
              'waiting',
              'active',
              'completed',
              'failed',
              'delayed',
            ],
            example: 'active',
            description:
              'none = no job active, waiting = queued, active = processing, completed = done, failed = error, delayed = retry pending',
          },
          progress: {
            type: 'number',
            example: 100,
            description: 'Progreso del job (0-100)',
          },
          encyclopedia: {
            type: 'string',
            description:
              'Contenido de la enciclopedia (solo si está completed)',
          },
          storageUrl: {
            type: 'string',
            description:
              'URL del archivo en blob storage (solo si está completed)',
            example:
              'https://storageaccount.blob.core.windows.net/container/encyclopedia.md',
          },
          error: {
            type: 'string',
            description: 'Mensaje de error (solo si failed)',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          processedAt: {
            type: 'string',
            format: 'date-time',
          },
          finishedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description:
        'Proyecto no encontrado o no hay job de enciclopedia activo para este proyecto',
    }),
    ApiForbiddenResponse({
      description: 'Prohibido - No tiene permisos para acceder a este proyecto',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
  );

export const ApiUploadProjectContext = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Subir contenido de texto como archivo de contexto',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del proyecto',
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
                  'https://storage.blob.core.windows.net/container/org-id/project-id/files/context.txt',
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Proyecto no encontrado',
    }),
    ApiForbiddenResponse({
      description:
        'Prohibido - No tiene permisos para subir contextos en este proyecto',
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido',
    }),
  );
