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
 * Custom exception for resources not found in the database.
 * Example: searching for a user by ID that does not exist.
 */
export class ResourceNotFoundException extends NestNotFoundException {
  constructor(resourceType: string, identifier: string, details?: unknown) {
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
 * Exception for business logic validation errors.
 * Used when the request is valid but cannot be processed due to an internal rule.
 * Example: An unauthorized user tries to create a project.
 */
export class BusinessLogicException extends HttpException {
  constructor(message: string, details?: unknown) {
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
 * Exception for input data validation errors, indicating which field failed and why.
 * Thrown when data does not meet required criteria.
 * Example: invalid email format or missing required field.
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
 * Exception indicating lack of permissions to perform a specific action on a resource.
 * Useful for access control and authorization policies.
 * Example: a user tries to delete a resource without dueño role.
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
 * Exception to indicate that the requested operation cannot be performed due to the current state of the resource.
 * Helps prevent inconsistent or invalid changes.
 * Example: trying to accept a project invitation that has already been accepted.
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
 * Exception for external service errors.
 */
export class ExternalServiceException extends NestInternalServerErrorException {
  constructor(serviceName: string, error: string, details?: unknown) {
    super({
      message: `External service '${serviceName}' error: ${error}`,
      error: 'External Service Error',
      serviceName,
      originalError: error,
      details,
    });
  }
}

// Re-export standard NestJS exceptions for convenience
export {
  NestBadRequestException as BadRequestException,
  NestNotFoundException as NotFoundException,
  NestUnauthorizedException as UnauthorizedException,
  NestForbiddenException as ForbiddenException,
  NestConflictException as ConflictException,
  NestInternalServerErrorException as InternalServerErrorException,
};
