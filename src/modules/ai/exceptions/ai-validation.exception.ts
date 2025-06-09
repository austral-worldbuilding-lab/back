import { BadRequestException } from '@nestjs/common';

export class AiValidationException extends BadRequestException {
  constructor(errors: string[], projectId?: string) {
    const message = `AI request validation failed: ${errors.join('; ')}`;
    super({
      message,
      errors,
      projectId,
      timestamp: new Date().toISOString(),
      code: 'AI_VALIDATION_FAILED',
    });
  }
}
