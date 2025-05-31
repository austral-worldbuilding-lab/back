import {
  HttpException,
  HttpStatus,
  BadRequestException as NestBadRequestException,
  NotFoundException as NestNotFoundException,
  UnauthorizedException as NestUnauthorizedException,
  ForbiddenException as NestForbiddenException,
  ConflictException as NestConflictException,
  InternalServerErrorException as NestInternalServerErrorException,
} from '@nestjs/common';

/**
 * Excepción personalizada para recursos no encontrados en la db
 * Ejemplo: buscar un usuario por ID que no existe.
 */
export class ResourceNotFoundException extends NestNotFoundException {
  constructor(resourceType: string, identifier: string, details?: any) {
    super({
      message: `${resourceType} with identifier '${identifier}' not found`,
      error: 'Resource Not Found',
      resourceType,
      identifier,
      details,
    });
  }
}

/**
 * Excepción para errores de validación de negocio
 * Se usa cuando la solicitud es válida pero no puede procesarse debido a una regla interna.
 * Ejemplo: Un usuario no autorizado inteta crear un proyecto
 */
export class BusinessLogicException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        error: 'Business Logic Error',
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Excepción para errores de validación de datos de entrada, indicando qué campo falló y por qué.
 * Se lanza cuando los datos no cumplen con los criterios requeridos.
 * Ejemplo: email con formato inválido o campo obligatorio faltante.
 */
export class ValidationException extends NestBadRequestException {
  constructor(
    field: string,
    value: unknown,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super({
      message: `Validation failed for field '${field}': ${message}`,
      error: 'Validation Error',
      field,
      value,
      details,
    });
  }
}

/**
 * Excepción que indica falta de permisos para realizar una acción específica sobre un recurso.
 *  Útil para controlar accesos y políticas de autorización.
 *  Ejemplo: un usuario intenta eliminar un recurso sin tener rol administrador.
 */
export class AuthorizationException extends NestUnauthorizedException {
  constructor(
    action: string,
    resource?: string,
    details?: Record<string, unknown>,
  ) {
    super({
      message: `Not authorized to perform '${action}'${resource ? ` on '${resource}'` : ''}`,
      error: 'Authorization Error',
      action,
      resource,
      details,
    });
  }
}

/**
 * Excepción para indicar que la operación solicitada no puede realizarse debido al estado actual del recurso.
 * Ayuda a prevenir cambios inconsistentes o inválidos.
 * Ejemplo: querer aceptar una invitación a proyecto cuando ya se ha aceptado.
 */
export class StateConflictException extends NestConflictException {
  constructor(
    currentState: string,
    attemptedAction: string,
    details?: Record<string, unknown>,
  ) {
    super({
      message: `Cannot perform '${attemptedAction}' while in state '${currentState}'`,
      error: 'State Conflict',
      currentState,
      attemptedAction,
      details,
    });
  }
}

/**
 * Excepción para errores de servicios externos
 */
export class ExternalServiceException extends NestInternalServerErrorException {
  constructor(serviceName: string, error: string, details?: any) {
    super({
      message: `External service '${serviceName}' error: ${error}`,
      error: 'External Service Error',
      serviceName,
      originalError: error,
      details,
    });
  }
}

// Re-exportar las excepciones estándar de NestJS para facilitar el uso
export {
  NestBadRequestException as BadRequestException,
  NestNotFoundException as NotFoundException,
  NestUnauthorizedException as UnauthorizedException,
  NestForbiddenException as ForbiddenException,
  NestConflictException as ConflictException,
  NestInternalServerErrorException as InternalServerErrorException,
};
