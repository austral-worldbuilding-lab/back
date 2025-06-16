import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InvitationDto } from '../dto/invitation.dto';
import { InvitationStatus } from '@prisma/client';

export const ApiCreateInvitation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear una nueva invitación' }),
    ApiResponse({
      status: 201,
      description: 'La invitación ha sido enviada exitosamente',
      type: InvitationDto,
    }),
    ApiResponse({ status: 400, description: 'Solicitud incorrecta' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo los miembros del proyecto pueden crear invitaciones',
    }),
  );

export const ApiGetAllInvitations = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener todas las invitaciones con filtros opcionales',
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
    ApiQuery({
      name: 'projectId',
      description: 'ID del proyecto (opcional)',
      type: String,
      required: false,
    }),
    ApiQuery({
      name: 'status',
      description: 'Estado de la invitación (opcional)',
      enum: InvitationStatus,
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Retorna una lista paginada de invitaciones',
      type: [InvitationDto],
    }),
  );

export const ApiGetInvitationsByProject = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener invitaciones por proyecto' }),
    ApiParam({
      name: 'projectId',
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
      description: 'Retorna una lista paginada de invitaciones del proyecto',
      type: [InvitationDto],
    }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo los miembros del proyecto pueden ver las invitaciones',
    }),
  );

export const ApiGetInvitation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener una invitación por ID' }),
    ApiParam({ name: 'id', description: 'ID de la invitación', type: String }),
    ApiResponse({
      status: 200,
      type: InvitationDto,
    }),
    ApiResponse({ status: 404, description: 'Invitación no encontrada' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo puedes ver invitaciones que enviaste o recibiste',
    }),
  );

export const ApiAcceptInvitation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Aceptar una invitación' }),
    ApiParam({ name: 'id', description: 'ID de la invitación', type: String }),
    ApiResponse({
      status: 200,
      description: 'La invitación ha sido aceptada exitosamente',
      type: InvitationDto,
    }),
    ApiResponse({ status: 404, description: 'Invitación no encontrada' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo el destinatario puede aceptar la invitación',
    }),
  );

export const ApiRejectInvitation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Rechazar una invitación' }),
    ApiParam({ name: 'id', description: 'ID de la invitación', type: String }),
    ApiResponse({
      status: 200,
      description: 'La invitación ha sido rechazada exitosamente',
      type: InvitationDto,
    }),
    ApiResponse({ status: 404, description: 'Invitación no encontrada' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo el destinatario puede rechazar la invitación',
    }),
  );

export const ApiDeleteInvitation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una invitación' }),
    ApiParam({ name: 'id', description: 'ID de la invitación', type: String }),
    ApiResponse({
      status: 200,
      description: 'La invitación ha sido eliminada exitosamente',
    }),
    ApiResponse({ status: 404, description: 'Invitación no encontrada' }),
    ApiResponse({
      status: 403,
      description:
        'Prohibido - Solo el remitente o destinatario puede eliminar la invitación',
    }),
  );
